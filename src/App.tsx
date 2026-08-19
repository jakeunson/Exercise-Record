import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_EXERCISES } from './types';
import type { Category, WorkoutSession, SetRecord, SubSet, Exercise } from './types';
import type { CustomExercise, ExerciseSettings } from './types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StorageService } from './services/storage';

import { useStorage } from './hooks/useStorage';
import { useSettingsState } from './hooks/useSettingsState';
import { useWorkoutState } from './hooks/useWorkoutState';
import { useHistoryState } from './hooks/useHistoryState';
import { useInBodyState } from './hooks/useInBodyState';

import ExerciseEditModal from './components/ExerciseEditModal';
import CategoryView from './views/CategoryView';
import SelectExerciseView from './views/SelectExerciseView';
import RecordView from './views/RecordView';
import SummaryView from './views/SummaryView';
import HistoryView from './views/HistoryView';
import InBodyListView from './views/InBodyListView';
import InBodyInputView from './views/InBodyInputView';
import SettingsView from './views/SettingsView';
import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal';
import AddCustomExerciseModal from './components/modals/AddCustomExerciseModal';
import './App.css';

type Step = 'category' | 'select' | 'record' | 'summary' | 'history' | 'inbody' | 'inbody_list' | 'settings';

const App: React.FC = () => {
  const { isLoaded, error } = useStorage();

  // Internal Step/Navigation State
  const [step, setStep] = useState<Step>('category');
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Form States
  const [currentSets, setCurrentSets] = useState<SetRecord[]>([]);
  const [tempSubSets, setTempSubSets] = useState<SubSet[]>([]);

  // InBody Input States
  const [ibWeight, setIbWeight] = useState(70);
  const [ibMuscle, setIbMuscle] = useState(30);
  const [ibFat, setIbFat] = useState(20);

  // Feedback/UI States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deletingSession, setDeletingSession] = useState<{id: string, date: string} | null>(null);
  const [deletingInBody, setDeletingInBody] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);
  
  // Timer States
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const wakeLockRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Hooks Initialization (Conditional on isLoaded) ---
  const settingsState = useSettingsState();
  const workoutState = useWorkoutState();
  const historyState = useHistoryState();
  const inBodyState = useInBodyState();

  // Handle Android Back Button
  useEffect(() => {
    const handleBackButton = () => {
      if (showExitModal) {
        setShowExitModal(false);
        return;
      }
      if (step === 'category') {
        setShowExitModal(true);
      } else if (step === 'record' || step === 'history' || step === 'settings' || step === 'summary' || step === 'select' || step === 'inbody' || step === 'inbody_list') {
        if (step === 'record') {
          if (currentSets.length > 0) showToast('운동이 임시 저장되었습니다 💾');
          setStep('select');
        } else if (step === 'select') {
          setStep('category');
        } else if (step === 'inbody') {
          setStep('inbody_list');
        } else {
          setStep('category');
        }
      }
    };

    const listener = CapacitorApp.addListener('backButton', handleBackButton);
    return () => {
      listener.then(l => l.remove());
    };
  }, [step, showExitModal]);

  // 00시(자정) 경과 시 임시 저장된 운동 자동 정리
  useEffect(() => {
    const handleVisibilityOrResume = () => {
      workoutState.reloadOngoingWorkouts();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrResume);
    const stateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) handleVisibilityOrResume();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrResume);
      stateListener.then(l => l.remove());
    };
  }, [workoutState]);

  // Synchronize currentSets and tempSubSets back to ongoingWorkouts while recording
  useEffect(() => {
    if (selectedExercise && step === 'record' && isLoaded) {
      const currentOngoing = workoutState.ongoingWorkouts;
      const existing = currentOngoing[selectedExercise.id];
      if (currentSets.length === 0 && tempSubSets.length === 0 && !existing) {
        return;
      }
      if (existing && existing.sets === currentSets && existing.tempSubSets === tempSubSets) {
        return;
      }
      workoutState.updateOngoingWorkouts({
        ...currentOngoing,
        [selectedExercise.id]: {
          sets: currentSets,
          tempSubSets: tempSubSets
        }
      });
    }
  }, [currentSets, tempSubSets, selectedExercise, step, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // History Filter
  const [filterMonth, setFilterMonth] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).substring(0, 7));

  useEffect(() => {
    if (!filterMonth) {
      setFilterMonth(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).substring(0, 7));
    }
  }, [filterMonth]);

  // Refresh Views when navigating
  useEffect(() => {
    if (!isLoaded) return;
    if (step === 'history') historyState.reloadHistory();
    if (step === 'inbody_list') inBodyState.reloadInBody();
    if (step === 'category') historyState.reloadHistory(); // Refresh workoutDates
  }, [step, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme
  const hexToRgb = (hex: string) => {
    let c = hex.substring(1);      // strip #
    if(c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const rgb = parseInt(c, 16);
    return `${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}`;
  };

  useEffect(() => {
    if (isLoaded) {
      document.documentElement.style.setProperty('--accent-color', settingsState.accentColor);
      document.documentElement.style.setProperty('--accent-rgb', hexToRgb(settingsState.accentColor));
    }
  }, [settingsState.accentColor, isLoaded]);

  const applyTheme = (color: string) => {
    settingsState.updateAccentColor(color);
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color));
  };

  // Timer
  const startTimer = useCallback(() => {
    if (settingsState.timerDuration === 0) return;
    setTimerActive(true);
    setTimerKey(k => k + 1);
  }, [settingsState.timerDuration]);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  // Wake Lock
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.error('Wake Lock failed:', err);
    }
  };

  useEffect(() => {
    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // Memos
  const filteredHistory = useMemo(() => {
    return historyState.historySessions
      .filter(s => !filterMonth || s.date.startsWith(filterMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [historyState.historySessions, filterMonth]);

  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES, ...workoutState.customExercises] as Exercise[];
  }, [workoutState.customExercises]);

  const activeCategories = useMemo(() => {
    const activeCats = new Set<Category>();
    Object.entries(workoutState.ongoingWorkouts).forEach(([exId, state]) => {
      if (state.sets.length > 0) {
        const ex = allExercises.find(e => e.id === exId);
        if (ex) activeCats.add(ex.category);
      }
    });
    return activeCats;
  }, [workoutState.ongoingWorkouts, allExercises]);

  const filteredExercises = useMemo(() => {
    if (!selectedCategory) return [];
    const base = allExercises.filter(ex => ex.category === selectedCategory);
    const usedIds = new Set(historyState.historySessions.map(s => s.exerciseId));
    
    return [...base].sort((a, b) => {
      const aUsed = usedIds.has(a.id) ? 1 : 0;
      const bUsed = usedIds.has(b.id) ? 1 : 0;
      if (aUsed !== bUsed) return bUsed - aUsed;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, allExercises, historyState.historySessions]);

  const getExSetting = useCallback((exerciseId: string): ExerciseSettings => {
    return settingsState.exerciseSettings.find(s => s.exerciseId === exerciseId) ?? { exerciseId, showName: true };
  }, [settingsState.exerciseSettings]);

  const selectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setStep('select');
  };

  const [prevSession, setPrevSession] = useState<WorkoutSession | null>(null);

  const startWorkout = (exercise: Exercise) => {
    const ongoing = workoutState.ongoingWorkouts[exercise.id];
    
    setSelectedExercise(exercise);
    setTimerActive(false);
    setStep('record');
    setPrevSession(StorageService.getLatestSession(exercise.id));
    
    if (!ongoing) {
      setCurrentSets([]);
      setTempSubSets([]);
    } else {
      setCurrentSets(ongoing.sets);
      setTempSubSets(ongoing.tempSubSets);
    }
  };

  // addSubSet and saveSet removed

  const finishWorkout = (finalSetsFromView?: any) => {
    stopTimer();
    // 이벤트 객체가 넘어오는 것을 방지하고 명확히 배열일 때만 사용
    const setsToSave = Array.isArray(finalSetsFromView) ? finalSetsFromView : currentSets;
    if (selectedExercise && setsToSave.length > 0) {
      historyState.saveSession({
        exerciseId: selectedExercise.id,
        date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
        sets: setsToSave,
      });
      setCurrentSets(setsToSave);
    }

    if (selectedExercise) {
      const copy = { ...workoutState.ongoingWorkouts };
      delete copy[selectedExercise.id];
      workoutState.updateOngoingWorkouts(copy);
    }

    setStep('summary');
  };

  const saveInBody = (dateStr: string, w: number, m: number, f: number) => {
    inBodyState.saveInBody({
      date: dateStr,
      weight: w,
      skeletalMuscleMass: m,
      bodyFatPercentage: f
    });
    setStep('inbody_list');
  };

  const handleExport = async () => {
    const json = StorageService.exportData();
    const fileName = `workout_backup_${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: '백업 파일 공유',
          text: '운동 기록 백업 파일입니다.',
          url: result.uri,
          dialogTitle: '백업 파일 저장 및 공유'
        });
      } catch (e) {
        console.error('Backup share error:', e);
        alert('백업 파일 생성 중 오류가 발생했습니다.');
      }
    } else {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await StorageService.importData(event.target?.result as string);
      setImportStatus(result ? 'success' : 'error');
      if (result) {
        setTimeout(() => {
          historyState.reloadHistory();
          inBodyState.reloadInBody();
          setStep('category');
        }, 1500);
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedExercise(null);
    setCurrentSets([]);
    setTempSubSets([]);
    setImportStatus('idle');
    setTimerActive(false);
    historyState.reloadHistory();
  };

  const handleLongPressStart = (exercise: Exercise) => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setEditingExercise(exercise);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleAddCustomExercise = () => {
    if (!newExName.trim() || !selectedCategory) return;
    const newEx: CustomExercise = {
      id: `custom-${Date.now()}`,
      name: newExName.trim(),
      category: selectedCategory,
      isCustom: true,
    };
    workoutState.saveCustomExercise(newEx);
    setNewExName('');
    setShowAddExercise(false);
  };

  // SwipePicker Options removed (not used anymore)

  // Loading Screen
  if (!isLoaded) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          {error ? '데이터를 불러오지 못했습니다.' : '데이터를 불러오는 중...'}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {step === 'category' && (
          <CategoryView
            activeCategories={activeCategories}
            selectCategory={selectCategory}
            setStep={setStep}
            historySessions={historyState.historySessions}
            allExercises={allExercises}
          />
        )}
        {step === 'settings' && (
          <SettingsView
            userProfile={settingsState.userProfile}
            updateUserProfile={settingsState.updateUserProfile}
            accentColor={settingsState.accentColor}
            applyTheme={applyTheme}
            timerDuration={settingsState.timerDuration}
            setTimerDuration={settingsState.updateTimerDuration}
            handleExport={handleExport}
            handleImport={handleImport}
            importStatus={importStatus}
            fileInputRef={fileInputRef}
            setStep={setStep}
          />
        )}
        {step === 'inbody_list' && (
          <InBodyListView
            userProfile={settingsState.userProfile}
            inBodyHistory={inBodyState.inBodyHistory}
            updateInBody={inBodyState.updateInBody}
            setDeletingInBody={setDeletingInBody}
            setStep={setStep}
          />
        )}
        {step === 'inbody' && (
          <InBodyInputView
            ibWeight={ibWeight} ibMuscle={ibMuscle} ibFat={ibFat}
            setIbWeight={setIbWeight} setIbMuscle={setIbMuscle} setIbFat={setIbFat}
            saveInBody={saveInBody} setStep={setStep}
          />
        )}
        {step === 'history' && (
          <HistoryView
            historySessions={historyState.historySessions}
            allExercises={allExercises}
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            filteredHistory={filteredHistory}
            setDeletingSession={setDeletingSession}
            setStep={setStep}
            updateSession={historyState.updateSession}
          />
        )}
        {step === 'select' && (
          <SelectExerciseView
            selectedCategory={selectedCategory}
            filteredExercises={filteredExercises}
            ongoingWorkouts={workoutState.ongoingWorkouts}
            getExSetting={getExSetting}
            startWorkout={startWorkout}
            handleLongPressStart={handleLongPressStart}
            handleLongPressEnd={handleLongPressEnd}
            setShowAddExercise={setShowAddExercise}
            setStep={setStep}
          />
        )}
        {step === 'record' && (
          <RecordView
            selectedExercise={selectedExercise}
            currentSets={currentSets}
            setCurrentSets={setCurrentSets}
            prevSession={prevSession}
            finishWorkout={finishWorkout}
            timerActive={timerActive} timerKey={timerKey} timerDuration={settingsState.timerDuration} stopTimer={stopTimer}
            startTimer={startTimer}
            showToast={showToast}
            setStep={setStep}
          />
        )}
        {step === 'summary' && (
          <SummaryView
            selectedExercise={selectedExercise}
            currentSets={currentSets}
            reset={reset}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ GLOBAL TOAST ══════════════════ */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(24, 24, 28, 0.96)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '20px',
              border: '1px solid var(--accent-color)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              fontSize: '0.85rem',
              fontWeight: 600,
              zIndex: 9999,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ DELETE MODALS ══════════════════ */}
      <AnimatePresence>
        {(deletingSession || deletingInBody) && (
          <ConfirmDeleteModal
            onCancel={() => { setDeletingSession(null); setDeletingInBody(null); }}
            onConfirm={() => {
              if (deletingSession) historyState.deleteSession(deletingSession.id, deletingSession.date);
              if (deletingInBody) inBodyState.deleteInBody(deletingInBody);
              setDeletingSession(null);
              setDeletingInBody(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ EXERCISE EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingExercise && (
          <ExerciseEditModal
            exercise={editingExercise}
            onClose={() => setEditingExercise(null)}
            onSaved={settingsState.reloadSettings}
            onDeleted={() => {
              workoutState.reloadCustomExercises();
              settingsState.reloadSettings();
            }}
          />
        )}
      </AnimatePresence>



      {/* ══════════════════ ADD CUSTOM EXERCISE MODAL ══════════════════ */}
      <AnimatePresence>
        {showAddExercise && (
          <AddCustomExerciseModal
            newExName={newExName}
            setNewExName={setNewExName}
            onCancel={() => { setShowAddExercise(false); setNewExName(''); }}
            onAdd={handleAddCustomExercise}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>앱 종료</h3>
              <p>앱을 종료하시겠습니까?</p>
              <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button className="secondary-btn" onClick={() => setShowExitModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>취소</button>
                <button className="danger-btn" onClick={() => CapacitorApp.exitApp()} style={{ flex: 1, padding: '12px', background: '#ff4444', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', cursor: 'pointer' }}>종료</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;