import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_EXERCISES } from './core/data/exercises';
import type { Category, WorkoutSession, SetRecord, SubSet, Exercise, CustomExercise, ExerciseSettings } from './core/types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ExportService } from './core/services/exportService';
import { WorkoutService } from './core/services/workoutService';
import { ThemeService } from './core/services/themeService';

import { useStorageInit } from './ui/hooks/useStorageInit';
import { useSettings } from './ui/hooks/useSettings';
import { useWorkout } from './ui/hooks/useWorkout';
import { useInBody } from './ui/hooks/useInBody';

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
import AddCategoryModal from './components/modals/AddCategoryModal';
import CategoryEditModal from './components/modals/CategoryEditModal';
import './App.css';

type Step = 'category' | 'select' | 'record' | 'summary' | 'history' | 'inbody' | 'inbody_list' | 'settings';

const App: React.FC = () => {
  const { isLoaded, error } = useStorageInit();

  const [step, setStep] = useState<Step>('category');
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const [currentSets, setCurrentSets] = useState<SetRecord[]>([]);
  const [tempSubSets, setTempSubSets] = useState<SubSet[]>([]);

  const [ibWeight, setIbWeight] = useState(70);
  const [ibMuscle, setIbMuscle] = useState(30);
  const [ibFat, setIbFat] = useState(20);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deletingSession, setDeletingSession] = useState<{id: string, date: string} | null>(null);
  const [deletingInBody, setDeletingInBody] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null); // any for now, since it's CategoryItem
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newExName, setNewExName] = useState('');
  
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);
  
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const wakeLockRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settings = useSettings();
  const workout = useWorkout();
  const inBody = useInBody();

  useEffect(() => {
    const handleBackButton = () => {
      if (editingCategory) { setEditingCategory(null); return; }
      if (showAddCategory) { setShowAddCategory(false); return; }
      if (editingExercise) { setEditingExercise(null); return; }
      if (showAddExercise) { setShowAddExercise(false); return; }
      if (deletingSession || deletingInBody) { setDeletingSession(null); setDeletingInBody(null); return; }

      if (showExitModal) {
        setShowExitModal(false);
        return;
      }
      if (step === 'category') {
        setShowExitModal(true);
      } else if (['record', 'history', 'settings', 'summary', 'select', 'inbody', 'inbody_list'].includes(step)) {
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
  }, [step, showExitModal, currentSets.length, showToast, editingCategory, showAddCategory, editingExercise, showAddExercise, deletingSession, deletingInBody]);

  useEffect(() => {
    const handleVisibilityOrResume = () => {
      workout.reload();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrResume);
    const stateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) handleVisibilityOrResume();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrResume);
      stateListener.then(l => l.remove());
    };
  }, [workout]);

  useEffect(() => {
    if (selectedExercise && step === 'record' && isLoaded) {
      const currentOngoing = workout.ongoingWorkouts;
      const existing = currentOngoing[selectedExercise.id];
      if (currentSets.length === 0 && tempSubSets.length === 0 && !existing) {
        return;
      }
      if (existing && existing.sets === currentSets && existing.tempSubSets === tempSubSets) {
        return;
      }
      workout.updateOngoingWorkouts({
        ...currentOngoing,
        [selectedExercise.id]: {
          sets: currentSets,
          tempSubSets: tempSubSets
        }
      });
    }
  }, [currentSets, tempSubSets, selectedExercise, step, isLoaded]);

  const [filterMonth, setFilterMonth] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).substring(0, 7));

  useEffect(() => {
    if (!filterMonth) {
      setFilterMonth(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).substring(0, 7));
    }
  }, [filterMonth]);

  useEffect(() => {
    if (isLoaded && settings.accentColor) {
      ThemeService.applyTheme(settings.accentColor);
    }
  }, [settings.accentColor, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (step === 'history') workout.reload();
    if (step === 'inbody_list') inBody.reload();
    if (step === 'category') {
      workout.reload(); 
      settings.reload();
    }
  }, [step, isLoaded]); 

  const startTimer = useCallback(() => {
    if (settings.timerDuration === 0) return;
    setTimerActive(true);
    setTimerKey(k => k + 1);
  }, [settings.timerDuration]);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

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

  const filteredHistory = useMemo(() => {
    return workout.sessions
      .filter(s => !filterMonth || s.date.startsWith(filterMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [workout.sessions, filterMonth]);

  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES, ...workout.customExercises].map(ex => {
      const overrideCat = settings.exerciseCategoryOverrides[ex.id];
      const setting = settings.exerciseSettings.find(s => s.exerciseId === ex.id);
      let updatedEx = { ...ex };
      if (overrideCat) updatedEx.category = overrideCat as Category;
      if (setting?.customName) updatedEx.name = setting.customName;
      return updatedEx;
    }) as Exercise[];
  }, [workout.customExercises, settings.exerciseCategoryOverrides, settings.exerciseSettings]);

  const activeCategories = useMemo(() => {
    const activeCats = new Set<string>();
    Object.entries(workout.ongoingWorkouts).forEach(([exId, state]) => {
      if (state.sets.length > 0) {
        const ex = allExercises.find(e => e.id === exId);
        if (ex) activeCats.add(ex.category);
      }
    });
    return activeCats;
  }, [workout.ongoingWorkouts, allExercises]);

  const filteredExercises = useMemo(() => {
    if (!selectedCategory) return [];
    const base = allExercises.filter(ex => ex.category === selectedCategory);
    const usedIds = new Set(workout.sessions.map(s => s.exerciseId));
    
    return [...base].sort((a, b) => {
      const aUsed = usedIds.has(a.id) ? 1 : 0;
      const bUsed = usedIds.has(b.id) ? 1 : 0;
      if (aUsed !== bUsed) return bUsed - aUsed;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, allExercises, workout.sessions]);

  const getExSetting = useCallback((exerciseId: string): ExerciseSettings => {
    return settings.exerciseSettings.find(s => s.exerciseId === exerciseId) ?? { exerciseId, showName: true };
  }, [settings.exerciseSettings]);

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setStep('select');
  };

  const [prevSession, setPrevSession] = useState<WorkoutSession | null>(null);

  const startWorkout = (exercise: Exercise) => {
    const ongoing = workout.ongoingWorkouts[exercise.id];
    
    setSelectedExercise(exercise);
    setTimerActive(false);
    setStep('record');
    setPrevSession(WorkoutService.getLatestSession(exercise.id));
    
    if (!ongoing) {
      setCurrentSets([]);
      setTempSubSets([]);
    } else {
      setCurrentSets(ongoing.sets);
      setTempSubSets(ongoing.tempSubSets);
    }
  };

  const finishWorkout = (finalSetsFromView?: any) => {
    stopTimer();
    const setsToSave = Array.isArray(finalSetsFromView) ? finalSetsFromView : currentSets;
    if (selectedExercise && setsToSave.length > 0) {
      workout.finishWorkout(selectedExercise, setsToSave, []);
      setCurrentSets(setsToSave);
    }

    setStep('summary');
  };

  const saveInBody = (dateStr: string, w: number, m: number, f: number) => {
    inBody.saveInBody({
      date: dateStr,
      weight: w,
      skeletalMuscleMass: m,
      bodyFatPercentage: f
    });
    setStep('inbody_list');
  };

  const handleExport = async () => {
    const json = ExportService.exportData();
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
      const result = await ExportService.importData(event.target?.result as string);
      setImportStatus(result ? 'success' : 'error');
      if (result) {
        setTimeout(() => {
          workout.reload();
          inBody.reload();
          settings.reload();
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
    workout.reload();
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
    workout.saveCustomExercise(newEx);
    setNewExName('');
    setShowAddExercise(false);
  };

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
            categories={settings.categories}
            activeCategories={activeCategories}
            selectCategory={selectCategory}
            setStep={setStep}
            historySessions={workout.sessions}
            allExercises={allExercises}
            onAddCategory={() => setShowAddCategory(true)}
            onEditCategory={(cat) => setEditingCategory(cat)}
          />
        )}
        {step === 'settings' && (
          <SettingsView
            userProfile={settings.userProfile}
            updateUserProfile={settings.updateUserProfile}
            accentColor={settings.accentColor}
            applyTheme={settings.updateAccentColor}
            timerDuration={settings.timerDuration}
            setTimerDuration={settings.updateTimerDuration}
            handleExport={handleExport}
            handleImport={handleImport}
            importStatus={importStatus}
            fileInputRef={fileInputRef}
            setStep={setStep}
          />
        )}
        {step === 'inbody_list' && (
          <InBodyListView
            userProfile={settings.userProfile}
            inBodyHistory={inBody.inBodyHistory}
            updateInBody={inBody.updateInBody}
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
            historySessions={workout.sessions}
            allExercises={allExercises}
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            filteredHistory={filteredHistory}
            setDeletingSession={setDeletingSession}
            setStep={setStep}
            updateSession={workout.updateSession}
          />
        )}
        {step === 'select' && (
          <SelectExerciseView
            selectedCategoryName={settings.categories.find(c => c.id === selectedCategory)?.name || '운동 선택'}
            filteredExercises={filteredExercises}
            ongoingWorkouts={workout.ongoingWorkouts}
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
            timerActive={timerActive} timerKey={timerKey} timerDuration={settings.timerDuration} stopTimer={stopTimer}
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
          <div className="global-toast-container">
            <motion.div
              className="global-toast"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(deletingSession || deletingInBody) && (
          <ConfirmDeleteModal
            onCancel={() => { setDeletingSession(null); setDeletingInBody(null); }}
            onConfirm={() => {
              if (deletingSession) workout.deleteSession(deletingSession.id, deletingSession.date);
              if (deletingInBody) inBody.deleteInBody(deletingInBody);
              setDeletingSession(null);
              setDeletingInBody(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingExercise && (
          <ExerciseEditModal
            exercise={editingExercise}
            onClose={() => setEditingExercise(null)}
            onSaved={settings.reload}
            onDeleted={() => {
              workout.reload();
              settings.reload();
            }}
            categories={settings.categories}
            onCategoryChanged={() => {
              settings.reload();
              workout.reload();
            }}
          />
        )}
      </AnimatePresence>

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

      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onAdd={(cat) => {
            const newCats = [...settings.categories, cat];
            settings.saveCategories(newCats);
            setShowAddCategory(false);
          }}
        />
      )}

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={(updatedCat) => {
            const idx = settings.categories.findIndex(c => c.id === updatedCat.id);
            const newCats = [...settings.categories];
            if (idx >= 0) newCats[idx] = updatedCat;
            settings.saveCategories(newCats);
            setEditingCategory(null);
          }}
          onDeleted={
            editingCategory.isCustom ? () => {
              const newCats = settings.categories.filter(c => c.id !== editingCategory.id);
              settings.saveCategories(newCats);
              setEditingCategory(null);
            } : undefined
          }
          onMoveUp={() => {
            const sortedCats = [...settings.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
            const idx = sortedCats.findIndex(c => c.id === editingCategory.id);
            if (idx > 0) {
              const temp = sortedCats[idx].order;
              sortedCats[idx].order = sortedCats[idx - 1].order;
              sortedCats[idx - 1].order = temp;
              settings.saveCategories(sortedCats);
              setEditingCategory(sortedCats[idx]);
            }
          }}
          onMoveDown={() => {
            const sortedCats = [...settings.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
            const idx = sortedCats.findIndex(c => c.id === editingCategory.id);
            if (idx >= 0 && idx < sortedCats.length - 1) {
              const temp = sortedCats[idx].order;
              sortedCats[idx].order = sortedCats[idx + 1].order;
              sortedCats[idx + 1].order = temp;
              settings.saveCategories(sortedCats);
              setEditingCategory(sortedCats[idx]);
            }
          }}
        />
      )}

      <AnimatePresence>
        {showExitModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content exit-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3>앱 종료</h3>
              <p>앱을 종료하시겠습니까?</p>
              <div className="modal-actions">
                <button className="secondary-btn" onClick={() => setShowExitModal(false)}>취소</button>
                <button className="danger-btn" onClick={() => CapacitorApp.exitApp()}>종료</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;