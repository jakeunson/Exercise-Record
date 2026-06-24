import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_EXERCISES } from './types';
import type { Category, WorkoutSession, SetRecord, SubSet, Exercise, InBodyRecord } from './types';
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
import WorkoutEditModal from './components/WorkoutEditModal';
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
import InBodyEditModal from './components/modals/InBodyEditModal';
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
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(10);
  const [tempSubSets, setTempSubSets] = useState<SubSet[]>([]);
  const [distance, setDistance] = useState(5.0);
  const [time, setTime] = useState(30);
  const [calories, setCalories] = useState(100);

  // InBody Input States
  const [ibWeight, setIbWeight] = useState(70);
  const [ibMuscle, setIbMuscle] = useState(30);
  const [ibFat, setIbFat] = useState(20);

  // Feedback/UI States
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deletingSession, setDeletingSession] = useState<{id: string, date: string} | null>(null);
  const [deletingInBody, setDeletingInBody] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const [editingInBody, setEditingInBody] = useState<InBodyRecord | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  
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
          setStep('select');
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

  // Inject dummy data for June 2026 running if requested
  useEffect(() => {
    if (isLoaded && !localStorage.getItem('dummy_june_seeded')) {
      const existing = StorageService.getSessions();
      existing.push({
        exerciseId: 'treadmill',
        date: '2026-06-15',
        sets: [
          { distance: 5.0, time: 30, calories: 350, subSets: [], timestamp: Date.now() },
          { distance: 3.0, time: 20, calories: 200, subSets: [], timestamp: Date.now() }
        ]
      });
      existing.push({
        exerciseId: 'squat',
        date: '2026-06-12',
        sets: [
          { subSets: [{weight: 80, reps: 10}, {weight: 80, reps: 10}], timestamp: Date.now() }
        ]
      });
      existing.push({
        exerciseId: 'treadmill',
        date: '2026-06-20',
        sets: [
          { distance: 6.0, time: 40, calories: 450, subSets: [], timestamp: Date.now() }
        ]
      });
      StorageService.saveSession(existing[existing.length - 3]);
      StorageService.saveSession(existing[existing.length - 2]);
      StorageService.saveSession(existing[existing.length - 1]);
      localStorage.setItem('dummy_june_seeded', 'true');
      historyState.reloadHistory();
    }
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh Views when navigating
  useEffect(() => {
    if (!isLoaded) return;
    if (step === 'history') historyState.reloadHistory();
    if (step === 'inbody_list') inBodyState.reloadInBody();
    if (step === 'category') historyState.reloadHistory(); // Refresh workoutDates
  }, [step, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme
  useEffect(() => {
    if (isLoaded) {
      document.documentElement.style.setProperty('--accent-color', settingsState.accentColor);
    }
  }, [settingsState.accentColor, isLoaded]);

  const applyTheme = (color: string) => {
    settingsState.updateAccentColor(color);
    document.documentElement.style.setProperty('--accent-color', color);
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
      setWeight(60); setReps(10); setDistance(5.0); setTime(30); setCalories(100);
      updatePrevSet(exercise.id, 0);
    } else {
      setCurrentSets(ongoing.sets);
      setTempSubSets(ongoing.tempSubSets);
      
      if (ongoing.sets.length > 0) {
        const lastSet = ongoing.sets[ongoing.sets.length - 1];
        if (exercise.category === 'cardio') {
          if (lastSet.distance) setDistance(lastSet.distance);
          if (lastSet.time) setTime(lastSet.time);
          if (lastSet.calories) setCalories(lastSet.calories);
        } else if (lastSet.subSets && lastSet.subSets.length > 0) {
          const lastSub = lastSet.subSets[lastSet.subSets.length - 1];
          setWeight(lastSub.weight);
          setReps(lastSub.reps);
        }
      } else {
        setWeight(60); setReps(10); setDistance(5.0); setTime(30); setCalories(100);
      }
      updatePrevSet(exercise.id, ongoing.sets.length);
    }
  };

  const updatePrevSet = (exerciseId: string, setIndex: number) => {
    const prev = StorageService.getPreviousSetRecord(exerciseId, setIndex);
    if (prev) {
      if (prev.subSets && prev.subSets.length > 0) {
        setWeight(prev.subSets[0].weight);
        setReps(prev.subSets[0].reps);
      }
      if (prev.distance) setDistance(prev.distance);
      if (prev.time) setTime(prev.time);
      if (prev.calories) setCalories(prev.calories);
    }
  };

  const addSubSet = () => setTempSubSets([...tempSubSets, { weight, reps }]);

  const saveSet = () => {
    let newSet: SetRecord;
    if (selectedExercise?.category === 'cardio') {
      newSet = { distance, time, calories, subSets: [], timestamp: Date.now() };
    } else {
      const finalSubSets = tempSubSets.length > 0 ? tempSubSets : [{ weight, reps }];
      newSet = { subSets: finalSubSets, timestamp: Date.now() };
    }
    const updatedSets = [...currentSets, newSet];
    setCurrentSets(updatedSets);
    setTempSubSets([]);
    if (selectedExercise) updatePrevSet(selectedExercise.id, updatedSets.length);
    
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 1000);
    startTimer();
  };

  const finishWorkout = () => {
    stopTimer();
    if (selectedExercise && (currentSets.length > 0 || tempSubSets.length > 0)) {
      const finalSets = [...currentSets];
      if (tempSubSets.length > 0 || (selectedExercise.category === 'cardio' && currentSets.length === 0)) {
        const pendingSet: SetRecord = selectedExercise.category === 'cardio' 
          ? { distance, time, calories, subSets: [], timestamp: Date.now() }
          : { subSets: tempSubSets.length > 0 ? tempSubSets : [{ weight, reps }], timestamp: Date.now() };
        finalSets.push(pendingSet);
      }
      historyState.saveSession({
        exerciseId: selectedExercise.id,
        date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
        sets: finalSets,
      });
      setCurrentSets(finalSets);
    }

    if (selectedExercise) {
      const copy = { ...workoutState.ongoingWorkouts };
      delete copy[selectedExercise.id];
      workoutState.updateOngoingWorkouts(copy);
    }

    setStep('summary');
  };

  const saveInBody = () => {
    inBodyState.saveInBody({
      date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
      weight: ibWeight,
      skeletalMuscleMass: ibMuscle,
      bodyFatPercentage: ibFat
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

  const weightOptions = Array.from({ length: 400 }, (_, i) => i * 0.5 + 5);
  const repOptions = Array.from({ length: 50 }, (_, i) => i + 1);
  const distanceOptions = Array.from({ length: 200 }, (_, i) => Math.round((i * 0.1 + 0.1) * 10) / 10);
  const timeOptions = Array.from({ length: 300 }, (_, i) => i);
  const calorieOptions = Array.from({ length: 150 }, (_, i) => i * 10);

  const ibWeightOptions = Array.from({ length: 1200 }, (_, i) => Math.round((i * 0.1 + 30) * 10) / 10);
  const ibMuscleOptions = Array.from({ length: 800 }, (_, i) => Math.round((i * 0.1 + 10) * 10) / 10);
  const ibFatOptions = Array.from({ length: 500 }, (_, i) => Math.round((i * 0.1 + 1) * 10) / 10);

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
            workoutDates={historyState.workoutDates}
          />
        )}
        {step === 'settings' && (
          <SettingsView
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
            inBodyHistory={inBodyState.inBodyHistory}
            setEditingInBody={setEditingInBody}
            setDeletingInBody={setDeletingInBody}
            setStep={setStep}
          />
        )}
        {step === 'inbody' && (
          <InBodyInputView
            ibWeight={ibWeight} ibMuscle={ibMuscle} ibFat={ibFat}
            setIbWeight={setIbWeight} setIbMuscle={setIbMuscle} setIbFat={setIbFat}
            ibWeightOptions={ibWeightOptions} ibMuscleOptions={ibMuscleOptions} ibFatOptions={ibFatOptions}
            saveInBody={saveInBody} setStep={setStep}
          />
        )}
        {step === 'history' && (
          <HistoryView
            historySessions={historyState.historySessions}
            allExercises={allExercises}
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            filteredHistory={filteredHistory}
            setEditingSession={setEditingSession}
            setDeletingSession={setDeletingSession}
            setStep={setStep}
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
            tempSubSets={tempSubSets}
            prevSession={prevSession}
            distance={distance} time={time} weight={weight} reps={reps} calories={calories}
            setDistance={setDistance} setTime={setTime} setWeight={setWeight} setReps={setReps} setCalories={setCalories}
            addSubSet={addSubSet} saveSet={saveSet} finishWorkout={finishWorkout}
            timerActive={timerActive} timerKey={timerKey} timerDuration={settingsState.timerDuration} stopTimer={stopTimer}
            showSaveToast={showSaveToast}
            setStep={setStep}
            distanceOptions={distanceOptions} timeOptions={timeOptions} weightOptions={weightOptions} repOptions={repOptions} calorieOptions={calorieOptions}
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

      {/* ══════════════════ WORKOUT EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingSession && (
          <WorkoutEditModal
            session={editingSession}
            allExercises={allExercises}
            onClose={() => setEditingSession(null)}
            onSaved={() => {
              historyState.reloadHistory();
            }}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ INBODY EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingInBody && (
          <InBodyEditModal
            record={editingInBody}
            onClose={() => setEditingInBody(null)}
            onSaved={() => {
              inBodyState.reloadInBody();
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