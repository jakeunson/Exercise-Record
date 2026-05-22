import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Check, ArrowLeft, History, 
  Activity, Calendar, Filter, Trash2, Camera, Settings, Download, Upload, Share2
} from 'lucide-react';
import { DEFAULT_EXERCISES, CATEGORIES } from './types';
import type { Category, WorkoutSession, SetRecord, SubSet, Exercise, InBodyRecord } from './types';
import type { CustomExercise, ExerciseSettings } from './types';
import { StorageService } from './services/storage';
import SwipePicker from './components/SwipePicker';
import InBodyChart from './components/InBodyChart';
import RestTimer from './components/RestTimer';
import WorkoutCalendar from './components/WorkoutCalendar';
import StatsCard from './components/StatsCard';
import ExerciseEditModal from './components/ExerciseEditModal';

type Step = 'category' | 'select' | 'record' | 'summary' | 'history' | 'inbody' | 'inbody_list' | 'settings';

const CATEGORY_IMAGES: Record<string, string> = {
  chest: '/category_icons/chest.jpg',
  back: '/category_icons/back.jpg',
  legs: '/category_icons/legs.jpg',
  shoulders: '/category_icons/shoulders.jpg',
  arms: '/category_icons/arms.jpg',
  cardio: '/category_icons/cardio.jpg',
};

// Theme presets
const THEMES = [
  { name: 'Spring Green', color: '#00E676' },
  { name: 'Neon Blue',    color: '#00B0FF' },
  { name: 'Violet',       color: '#CE93D8' },
  { name: 'Sunset',       color: '#FF6E40' },
  { name: 'Volt Yellow',  color: '#D4E157' },
];

// Timer options (0 = OFF)
const TIMER_OPTIONS = [
  { label: 'OFF', value: 0 },
  { label: '30초', value: 30 },
  { label: '60초', value: 60 },
  { label: '90초', value: 90 },
  { label: '2분', value: 120 },
];

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [currentSets, setCurrentSets] = useState<SetRecord[]>([]);
  
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(10);
  const [tempSubSets, setTempSubSets] = useState<SubSet[]>([]);
  
  const [distance, setDistance] = useState(5.0);
  const [time, setTime] = useState(30);

  const [prevSet, setPrevSet] = useState<SetRecord | null>(null);

  // History Filters
  const [historySessions, setHistorySessions] = useState<WorkoutSession[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterExerciseId, setFilterExerciseId] = useState<string>('');
  const [deletingSession, setDeletingSession] = useState<{id: string, date: string} | null>(null);

  // InBody
  const [inBodyHistory, setInBodyHistory] = useState<InBodyRecord[]>([]);
  const [ibWeight, setIbWeight] = useState(70);
  const [ibMuscle, setIbMuscle] = useState(30);
  const [ibFat, setIbFat] = useState(20);
  const [deletingInBody, setDeletingInBody] = useState<string | null>(null);

  // Feedback
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Wake Lock
  const wakeLockRef = useRef<any>(null);

  // ─── Feature 1: Rest Timer ───────────────────────────────────────────────
  const [timerActive, setTimerActive] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerDuration, setTimerDuration] = useState<number>(() => StorageService.getTimerDuration());

  const startTimer = useCallback(() => {
    if (timerDuration === 0) return;
    setTimerActive(true);
    setTimerKey(k => k + 1);
  }, [timerDuration]);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  // ─── Feature 2: Exercise Customization ───────────────────────────────────
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>(() => StorageService.getCustomExercises());
  const [exerciseSettings, setExerciseSettings] = useState<ExerciseSettings[]>(() => StorageService.getExerciseSettings());
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshExerciseSettings = useCallback(() => {
    setExerciseSettings(StorageService.getExerciseSettings());
    setCustomExercises(StorageService.getCustomExercises());
  }, []);

  const getExSetting = useCallback((exerciseId: string): ExerciseSettings => {
    return exerciseSettings.find(s => s.exerciseId === exerciseId) ?? { exerciseId, showName: true };
  }, [exerciseSettings]);

  // ─── Feature 3: Calendar & Stats ─────────────────────────────────────────
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(() => StorageService.getWorkoutDates());

  // ─── Feature 4: Theme ────────────────────────────────────────────────────
  const [accentColor, setAccentColor] = useState<string>(() => StorageService.getTheme());

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  const applyTheme = (color: string) => {
    setAccentColor(color);
    StorageService.saveTheme(color);
    document.documentElement.style.setProperty('--accent-color', color);
  };

  // ─── Wake Lock ───────────────────────────────────────────────────────────
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const weightOptions = Array.from({ length: 400 }, (_, i) => i * 0.5 + 5);
  const repOptions = Array.from({ length: 50 }, (_, i) => i + 1);
  const distanceOptions = Array.from({ length: 200 }, (_, i) => Math.round((i * 0.1 + 0.1) * 10) / 10);
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  const ibWeightOptions = Array.from({ length: 400 }, (_, i) => i * 0.5 + 30);
  const ibMuscleOptions = Array.from({ length: 200 }, (_, i) => i * 0.5 + 10);
  const ibFatOptions = Array.from({ length: 100 }, (_, i) => i * 0.5 + 1);

  useEffect(() => {
    if (step === 'history') {
      const s = StorageService.getSessions();
      setHistorySessions(s);
    }
    if (step === 'inbody_list') setInBodyHistory(StorageService.getInBodyHistory());
    if (step === 'category') setWorkoutDates(StorageService.getWorkoutDates());
  }, [step]);

  const filteredHistory = useMemo(() => {
    return historySessions
      .filter(s => !filterDate || s.date === filterDate)
      .filter(s => !filterExerciseId || s.exerciseId === filterExerciseId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [historySessions, filterDate, filterExerciseId]);

  // All exercises = DEFAULT + custom, merged
  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES, ...customExercises] as Exercise[];
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    if (!selectedCategory) return [];
    const base = allExercises.filter(ex => ex.category === selectedCategory);
    const sessions = StorageService.getSessions();
    const usedIds = new Set(sessions.map(s => s.exerciseId));
    
    return [...base].sort((a, b) => {
      const aUsed = usedIds.has(a.id) ? 1 : 0;
      const bUsed = usedIds.has(b.id) ? 1 : 0;
      if (aUsed !== bUsed) return bUsed - aUsed;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, allExercises]);

  const selectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setStep('select');
  };

  const startWorkout = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentSets([]);
    setTempSubSets([]);
    setTimerActive(false);
    setStep('record');
    updatePrevSet(exercise.id, 0);
  };

  const deleteWorkout = (exerciseId: string, date: string) => {
    StorageService.deleteSession(exerciseId, date);
    setHistorySessions(StorageService.getSessions());
  };

  const updatePrevSet = (exerciseId: string, setIndex: number) => {
    const prev = StorageService.getPreviousSetRecord(exerciseId, setIndex);
    setPrevSet(prev);
    if (prev) {
      if (prev.subSets && prev.subSets.length > 0) {
        setWeight(prev.subSets[0].weight);
        setReps(prev.subSets[0].reps);
      }
      if (prev.distance) setDistance(prev.distance);
      if (prev.time) setTime(prev.time);
    }
  };

  const addSubSet = () => setTempSubSets([...tempSubSets, { weight, reps }]);

  const saveSet = () => {
    let newSet: SetRecord;
    if (selectedExercise?.category === 'cardio') {
      newSet = { distance, time, subSets: [], timestamp: Date.now() };
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

    // Start rest timer
    startTimer();
  };

  const finishWorkout = () => {
    // Stop timer if running
    stopTimer();
    if (selectedExercise && (currentSets.length > 0 || tempSubSets.length > 0)) {
      const finalSets = [...currentSets];
      if (tempSubSets.length > 0 || (selectedExercise.category === 'cardio' && currentSets.length === 0)) {
        const pendingSet: SetRecord = selectedExercise.category === 'cardio' 
          ? { distance, time, subSets: [], timestamp: Date.now() }
          : { subSets: tempSubSets.length > 0 ? tempSubSets : [{ weight, reps }], timestamp: Date.now() };
        finalSets.push(pendingSet);
      }
      StorageService.saveSession({
        exerciseId: selectedExercise.id,
        date: new Date().toISOString().split('T')[0],
        sets: finalSets,
      });
      setCurrentSets(finalSets);
    }
    setStep('summary');
  };

  const saveInBody = () => {
    StorageService.saveInBody({
      date: new Date().toISOString().split('T')[0],
      weight: ibWeight,
      skeletalMuscleMass: ibMuscle,
      bodyFatPercentage: ibFat
    });
    setStep('inbody_list');
  };

  const deleteInBody = (date: string) => {
    StorageService.deleteInBody(date);
    setInBodyHistory(StorageService.getInBodyHistory());
  };

  const handleExport = () => {
    const json = StorageService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = StorageService.importData(event.target?.result as string);
      setImportStatus(result ? 'success' : 'error');
      if (result) setTimeout(() => setStep('category'), 1500);
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
    setWorkoutDates(StorageService.getWorkoutDates());
  };

  // Long press handlers for exercise editing
  const handleLongPressStart = (exercise: Exercise) => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      setEditingExercise(exercise);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Add custom exercise
  const handleAddCustomExercise = () => {
    if (!newExName.trim() || !selectedCategory) return;
    const newEx: CustomExercise = {
      id: `custom-${Date.now()}`,
      name: newExName.trim(),
      category: selectedCategory,
      isCustom: true,
    };
    StorageService.saveCustomExercise(newEx);
    setCustomExercises(StorageService.getCustomExercises());
    setNewExName('');
    setShowAddExercise(false);
  };

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {/* ══════════════════ CATEGORY (HOME) ══════════════════ */}
        {step === 'category' && (
          <motion.div
            key="category"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="step-container"
            style={{ overflowY: 'auto' }}
          >
            <header className="home-header">
              <div className="title-area">
                <h1>운동 기록</h1>
                <p>부위를 선택하세요</p>
              </div>
              <div className="header-actions">
                <button className="icon-trigger" onClick={() => setStep('inbody_list')}>
                  <Activity size={22} />
                </button>
                <button className="icon-trigger" onClick={() => setStep('history')}>
                  <History size={22} />
                </button>
                <button className="icon-trigger" onClick={() => setStep('settings')}>
                  <Settings size={22} />
                </button>
              </div>
            </header>

            {/* 카테고리 그리드가 위, 달력이 아래 */}
            <div className="category-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className="category-square image-btn"
                  onClick={() => selectCategory(cat.id)}
                >
                  <img src={CATEGORY_IMAGES[cat.id]} alt={cat.name} className="cat-img" />
                  <div className="cat-overlay">
                    <span>{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Feature 3: Mini Calendar - 달력은 아래 */}
            <WorkoutCalendar workoutDates={workoutDates} />
          </motion.div>
        )}

        {/* ══════════════════ SETTINGS ══════════════════ */}
        {step === 'settings' && (
          <motion.div
            key="settings"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="step-container"
            style={{ overflowY: 'auto' }}
          >
            <header className="record-header">
              <button onClick={() => setStep('category')} className="back-btn">
                <ArrowLeft size={20} />
              </button>
              <h1>설정</h1>
              <div className="header-right" />
            </header>
            
            <div className="settings-list">
              {/* Feature 4: Theme */}
              <div className="settings-section">
                <h2>테마 컬러</h2>
                <p>앱 전체 강조 컬러를 변경합니다.</p>
                <div className="theme-palettes">
                  {THEMES.map(t => (
                    <button
                      key={t.color}
                      className={`theme-dot ${accentColor === t.color ? 'active' : ''}`}
                      style={{ background: t.color }}
                      onClick={() => applyTheme(t.color)}
                      title={t.name}
                    />
                  ))}
                </div>
              </div>

              {/* Feature 1: Timer Duration */}
              <div className="settings-section">
                <h2>휴식 타이머</h2>
                <p>세트 저장 후 자동 시작되는 휴식 타이머 시간을 설정합니다.</p>
                <div className="timer-options">
                  {TIMER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`timer-opt-btn ${timerDuration === opt.value ? 'active' : ''}`}
                      onClick={() => {
                        setTimerDuration(opt.value);
                        StorageService.saveTimerDuration(opt.value);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Backup */}
              <div className="settings-section">
                <h2>데이터 백업 및 복구</h2>
                <p>다른 기기로 데이터를 이동하거나<br/>현재 데이터를 안전하게 보관하세요.</p>
                
                <div className="settings-actions">
                  <button className="settings-btn export" onClick={handleExport}>
                    <Download size={20} />
                    <span>백업 파일 내보내기</span>
                  </button>
                  
                  <button className="settings-btn import" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={20} />
                    <span>백업 파일 불러오기</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept=".json"
                    onChange={handleImport}
                  />
                </div>

                {importStatus === 'success' && (
                  <div className="status-msg success">데이터가 성공적으로 복구되었습니다!</div>
                )}
                {importStatus === 'error' && (
                  <div className="status-msg error">파일 형식이 잘못되었습니다. 다시 확인해주세요.</div>
                )}
              </div>

              <div className="settings-info">
                <Share2 size={16} />
                <span>백업 파일(.json)을 카카오톡 나에게 보내기 등으로 공유한 뒤, 다른 기기에서 불러오시면 됩니다.</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ INBODY LIST ══════════════════ */}
        {step === 'inbody_list' && (
          <motion.div
            key="inbody_list"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="step-container"
            style={{ overflowY: 'auto' }}
          >
            <header className="record-header">
              <button onClick={() => setStep('category')} className="back-btn">
                <ArrowLeft size={20} />
              </button>
              <h1>인바디 히스토리</h1>
              <div className="header-right">
                <button className="add-btn-small" onClick={() => setStep('inbody')}>
                  <Plus size={20} />
                </button>
              </div>
            </header>
            
            <InBodyChart data={inBodyHistory} />

            <div className="history-list">
              {inBodyHistory.length > 0 ? (
                inBodyHistory.map((rec) => (
                  <div key={rec.date} className="history-card">
                    <div className="card-top">
                      <span className="card-date">{rec.date}</span>
                      <button className="delete-btn" onClick={() => setDeletingInBody(rec.date)}>
                        <Trash2 size={16} color="#ff4444" />
                      </button>
                    </div>
                    <div className="inbody-stats-grid">
                      <div className="stat-box">
                        <span className="label">체중</span>
                        <span className="val">{rec.weight}kg</span>
                      </div>
                      <div className="stat-box">
                        <span className="label">골격근량</span>
                        <span className="val">{rec.skeletalMuscleMass}kg</span>
                      </div>
                      <div className="stat-box">
                        <span className="label">체지방률</span>
                        <span className="val">{rec.bodyFatPercentage}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Activity size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p>기록된 인바디가 없습니다.</p>
                  <button className="main-btn" style={{ marginTop: 20 }} onClick={() => setStep('inbody')}>
                    첫 기록 추가하기
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════ INBODY INPUT ══════════════════ */}
        {step === 'inbody' && (
          <motion.div
            key="inbody"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="step-container"
            style={{ overflowY: 'auto' }}
          >
            <header className="record-header">
              <button onClick={() => setStep('inbody_list')} className="back-btn">
                <ArrowLeft size={20} />
              </button>
              <h1>인바디 기록 추가</h1>
              <div className="header-right" />
            </header>
            <div className="record-main compact-pickers">
              <div className="pickers-row">
                <SwipePicker label="체중 (kg)" value={ibWeight} onChange={setIbWeight} options={ibWeightOptions} />
                <SwipePicker label="골격근량 (kg)" value={ibMuscle} onChange={setIbMuscle} options={ibMuscleOptions} />
                <SwipePicker label="체지방률 (%)" value={ibFat} onChange={setIbFat} options={ibFatOptions} />
              </div>
              <div className="info-tip">
                <Camera size={16} />
                <span>결과지 사진을 채팅창에 업로드하면<br/>데이터 추출을 도와드릴 수 있습니다!</span>
              </div>
            </div>
            <button className="large-save-btn" style={{ width: '100%' }} onClick={saveInBody}>
              저장하기
            </button>
          </motion.div>
        )}

        {/* ══════════════════ HISTORY ══════════════════ */}
        {step === 'history' && (
          <motion.div
            key="history"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="step-container"
            style={{ overflowY: 'auto' }}
          >
            <header className="record-header">
              <button onClick={() => setStep('category')} className="back-btn">
                <ArrowLeft size={20} />
              </button>
              <h1>운동 히스토리</h1>
              <div className="header-right" />
            </header>

            {/* Feature 3: Stats Card */}
            <StatsCard sessions={historySessions} />

            <div className="history-filters">
              <div className="filter-item">
                <Calendar size={14} />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="date-input" />
              </div>
              <div className="filter-item">
                <Filter size={14} />
                <select value={filterExerciseId} onChange={(e) => setFilterExerciseId(e.target.value)} className="select-input">
                  <option value="">모든 운동</option>
                  {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
            </div>

            <div className="history-list">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((session) => {
                  const ex = allExercises.find(e => e.id === session.exerciseId);
                  return (
                    <div key={`${session.exerciseId}-${session.date}`} className="history-card">
                      <div className="card-top">
                        <div className="info-group">
                          <span className="card-date">{session.date}</span>
                          <span className="card-name">{ex?.name}</span>
                        </div>
                        <button className="delete-btn" onClick={() => setDeletingSession({ id: session.exerciseId, date: session.date })}>
                          <Trash2 size={16} color="#ff4444" />
                        </button>
                      </div>
                      <div className="card-sets">
                        {session.sets.map((set, si) => (
                          <div key={si} className="set-row">
                            <span className="set-num">{si + 1}세트:</span>
                            <span className="set-val">
                              {ex?.category === 'cardio' ? `${set.distance}km / ${set.time}분` : set.subSets.map(ss => `${ss.weight}kgx${ss.reps}`).join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : <div className="empty-state">기록이 없습니다.</div>}
            </div>
          </motion.div>
        )}

        {/* ══════════════════ SELECT EXERCISE ══════════════════ */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="step-container"
            style={{ overflowY: 'auto' }}
          >
            <header className="record-header">
              <button onClick={() => setStep('category')} className="back-btn">
                <ArrowLeft size={20} />
              </button>
              <h1>{CATEGORIES.find(c => c.id === selectedCategory)?.name} 운동</h1>
              <div className="header-right" />
            </header>
            <div className="exercise-grid">
              {filteredExercises.map((ex) => {
                const setting = getExSetting(ex.id);
                const isCustom = (ex as CustomExercise).isCustom === true;
                return (
                  <button
                    key={ex.id}
                    className={`exercise-square ${isCustom ? 'custom-ex' : ''}`}
                    onClick={() => startWorkout(ex)}
                    onMouseDown={() => handleLongPressStart(ex)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(ex)}
                    onTouchEnd={handleLongPressEnd}
                  >
                    {setting.customImage && (
                      <img src={setting.customImage} alt={ex.name} className="ex-custom-img" />
                    )}
                    {setting.showName && (
                      <span className={setting.customImage ? 'ex-name-overlay' : ''}>{ex.name}</span>
                    )}
                    {!setting.customImage && !setting.showName && (
                      <span style={{ fontSize: '1.5rem' }}>🏋️</span>
                    )}
                  </button>
                );
              })}
              {/* Add custom exercise button */}
              <button
                className="exercise-square add-ex-square"
                onClick={() => setShowAddExercise(true)}
              >
                <Plus size={24} color="var(--muted-color)" />
                <span style={{ fontSize: '0.65rem', color: 'var(--muted-color)' }}>추가</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ RECORD ══════════════════ */}
        {step === 'record' && selectedExercise && (
          <motion.div
            key="record"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="step-container"
          >
            <header className="record-header">
              <button onClick={() => setStep('select')} className="back-btn">
                <ArrowLeft size={20} />
              </button>
              <h1>{selectedExercise.name}</h1>
              <div className="header-right">
                <motion.span 
                  key={currentSets.length}
                  initial={{ scale: 1.3, color: "#fff" }}
                  animate={{ scale: 1, color: "var(--accent-color)" }}
                  className="set-badge"
                >
                  {currentSets.length + 1} 세트
                </motion.span>
              </div>
            </header>

            <div className="record-scroll-area">
              <AnimatePresence>
                {showSaveToast && (
                  <div className="save-toast-wrapper">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="save-toast"
                    >
                      <Check size={20} />
                      <span>{currentSets.length}세트 저장됨!</span>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <div className="prev-info">
                <History size={16} />
                {prevSet ? (
                  <span>
                    지난 기록: {selectedExercise.category === 'cardio' 
                      ? `${prevSet.distance}km / ${prevSet.time}분`
                      : prevSet.subSets.map(s => `${s.weight}kgx${s.reps}`).join(', ')}
                  </span>
                ) : <span>첫 기록입니다. 화이팅!</span>}
              </div>

              {selectedExercise.category === 'cardio' ? (
                <div className="pickers-group">
                  <SwipePicker label="거리 (km)" value={distance} onChange={setDistance} options={distanceOptions} />
                  <SwipePicker label="시간 (분)" value={time} onChange={setTime} options={timeOptions} />
                </div>
              ) : (
                <div className="record-main">
                  <div className="temp-subsets">
                    {tempSubSets.map((s, i) => <div key={i} className="subset-tag">{s.weight}kg x {s.reps}회</div>)}
                    {tempSubSets.length > 0 && <button className="add-sub-btn" onClick={addSubSet}>+</button>}
                  </div>
                  <div className="pickers-group">
                    <SwipePicker label="무게 (kg)" value={weight} onChange={setWeight} options={weightOptions} />
                    <SwipePicker label="횟수" value={reps} onChange={setReps} options={repOptions} />
                  </div>
                  {tempSubSets.length === 0 && <button className="add-load-btn" onClick={addSubSet}>중량 추가 (선택사항)</button>}
                </div>
              )}
            </div>

            {/* Feature 1: Rest Timer — shown above action buttons */}
            <AnimatePresence>
              {timerActive && timerDuration > 0 && (
                <RestTimer
                  key={timerKey}
                  duration={timerDuration}
                  timerKey={timerKey}
                  onComplete={stopTimer}
                  onSkip={stopTimer}
                />
              )}
            </AnimatePresence>

            <div className="actions-group-large">
              <button className="large-save-btn" onClick={saveSet}>세트 저장</button>
              <button className="large-finish-btn" onClick={finishWorkout}>운동 종료</button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ SUMMARY ══════════════════ */}
        {step === 'summary' && selectedExercise && (
          <motion.div
            key="summary"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="step-container summary-step"
          >
            <div className="success-icon"><Check size={48} color="var(--accent-color)" /></div>
            <h1>오늘의 성과</h1>
            <div className="summary-card">
              <div className="summary-row"><span>운동</span><span>{selectedExercise.name}</span></div>
              <div className="summary-row"><span>총 세트</span><span>{currentSets.length} 세트</span></div>
              {selectedExercise.category === 'cardio' ? (
                <div className="summary-row"><span>총 거리</span><span>{currentSets.reduce((acc, s) => acc + (s.distance || 0), 0).toFixed(1)} km</span></div>
              ) : (
                <div className="summary-row"><span>총 볼륨</span><span>{currentSets.reduce((acc, s) => acc + s.subSets.reduce((a, b) => a + b.weight * b.reps, 0), 0)} kg</span></div>
              )}
            </div>
            <button className="main-btn" onClick={reset}>홈으로 이동</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ DELETE MODALS ══════════════════ */}
      <AnimatePresence>
        {(deletingSession || deletingInBody) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="confirm-modal">
              <h2>기록 삭제</h2>
              <p>정말 이 기록을 삭제하시겠습니까?</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => { setDeletingSession(null); setDeletingInBody(null); }}>취소</button>
                <button className="confirm-delete-btn" onClick={() => {
                  if (deletingSession) deleteWorkout(deletingSession.id, deletingSession.date);
                  if (deletingInBody) deleteInBody(deletingInBody);
                  setDeletingSession(null);
                  setDeletingInBody(null);
                }}>삭제</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ EXERCISE EDIT MODAL ══════════════════ */}
      <AnimatePresence>
        {editingExercise && (
          <ExerciseEditModal
            exercise={editingExercise}
            onClose={() => setEditingExercise(null)}
            onSaved={refreshExerciseSettings}
            onDeleted={() => {
              setCustomExercises(StorageService.getCustomExercises());
              setExerciseSettings(StorageService.getExerciseSettings());
            }}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════ ADD CUSTOM EXERCISE MODAL ══════════════════ */}
      <AnimatePresence>
        {showAddExercise && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddExercise(false); }}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ gap: 16 }}
            >
              <h2>운동 추가</h2>
              <input
                className="add-ex-input"
                placeholder="운동 이름 입력"
                value={newExName}
                onChange={e => setNewExName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustomExercise()}
                autoFocus
              />
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => { setShowAddExercise(false); setNewExName(''); }}>취소</button>
                <button className="confirm-delete-btn" style={{ background: 'var(--fg-color)', color: 'var(--bg-color)' }} onClick={handleAddCustomExercise}>추가</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .app-container { width: 100%; height: 100%; display: flex; flex-direction: column; }
        .home-header { display: flex; justify-content: space-between; align-items: flex-start; padding-top: 32px; }
        .header-actions { display: flex; gap: 8px; }
        .icon-trigger { 
          padding: 10px; background: var(--card-bg); border-radius: 12px; 
          border: 1px solid var(--border-color); color: var(--fg-color);
        }
        .category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; width: 100%; align-content: start; }
        .category-square {
          aspect-ratio: 1 / 1; display: flex; flex-direction: column; justify-content: center;
          align-items: center; background: var(--card-bg); border-radius: 16px;
          border: 1px solid var(--border-color); position: relative; overflow: hidden;
        }
        .image-btn { padding: 0; border: none; }
        .cat-img { width: 100%; height: 100%; object-fit: cover; }
        .cat-overlay { position: absolute; inset: 0; background: linear-gradient(transparent 60%, rgba(0,0,0,0.8)); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px; }
        .cat-overlay span { display: none; }
        
        .history-filters { display: flex; gap: 8px; margin-bottom: 8px; }
        .filter-item { 
          flex: 1; display: flex; align-items: center; gap: 4px; 
          background: var(--card-bg); padding: 6px 10px; border-radius: 10px;
          border: 1px solid var(--border-color); font-size: 0.75rem;
        }
        .date-input, .select-input { background: transparent; border: none; color: var(--fg-color); font-size: 0.75rem; width: 100%; outline: none; }
        .history-list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; }
        .history-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .card-date { font-size: 0.7rem; color: var(--muted-color); }
        .card-name { font-size: 0.9rem; font-weight: 700; }
        .card-sets { display: flex; flex-direction: column; gap: 3px; border-top: 1px solid var(--border-color); padding-top: 6px; }
        .set-row { font-size: 0.8rem; display: flex; gap: 6px; }
        .set-num { color: var(--muted-color); }

        .exercise-grid { 
          display: grid; 
          grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; width: 100%;
          padding-bottom: 20px; align-content: start;
        }
        .exercise-square {
          aspect-ratio: 1 / 1; display: flex; flex-direction: column; justify-content: center;
          align-items: center; background: var(--card-bg); border-radius: 14px;
          border: 1px solid var(--border-color); padding: 10px; text-align: center;
          position: relative; overflow: hidden; gap: 4px;
          -webkit-user-select: none; user-select: none;
        }
        .exercise-square span { font-size: 1rem; font-weight: 800; color: var(--fg-color); line-height: 1.2; word-break: keep-all; }
        .custom-ex { border-color: rgba(255,255,255,0.25); }
        .ex-custom-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .ex-name-overlay {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          padding: 8px 6px 6px;
          font-size: 0.8rem !important;
          font-weight: 800; color: #fff !important;
          z-index: 1;
        }
        .add-ex-square { border-style: dashed; flex-direction: column; gap: 2px; }
        .add-ex-input {
          width: 100%; background: var(--border-color); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 12px; color: var(--fg-color);
          font-size: 0.9rem; font-family: inherit; outline: none;
        }
        .add-ex-input:focus { border-color: var(--accent-color); }

        .record-header { 
          position: sticky; top: 0; background: var(--bg-color); z-index: 10;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          min-height: 56px;
          padding: 32px 0 14px;
          margin-bottom: 4px;
        }
        .record-header h1 { font-size: 1.2rem; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .header-right { display: flex; align-items: center; justify-content: flex-end; min-width: 36px; flex-shrink: 0; }
        
        .set-badge { 
          font-size: 0.85rem; padding: 4px 12px; background: var(--border-color); 
          border-radius: 12px; font-weight: 800; color: var(--accent-color);
          box-shadow: 0 0 15px rgba(0, 230, 118, 0.2);
          white-space: nowrap;
        }

        .record-scroll-area {
          flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
          padding-bottom: 12px;
        }
        
        .save-toast-wrapper { position: fixed; inset: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; z-index: 2000; }
        .save-toast { background: var(--accent-color); color: #000; padding: 16px 32px; border-radius: 50px; display: flex; align-items: center; gap: 12px; font-size: 1.2rem; font-weight: 900; box-shadow: 0 10px 40px rgba(0, 230, 118, 0.6); backdrop-filter: blur(8px); border: 2px solid rgba(255, 255, 255, 0.3); }

        /* Feature 1: Rest Timer styles */
        .rest-timer-bar {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: 16px; padding: 10px 14px;
          margin-bottom: 4px;
        }
        .timer-ring-wrap {
          position: relative; width: 68px; height: 68px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .timer-count {
          position: absolute; font-size: 1.2rem; font-weight: 900;
          color: var(--accent-color);
        }
        .timer-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .timer-label { font-size: 0.85rem; font-weight: 700; color: var(--fg-color); }
        .timer-sub { font-size: 0.65rem; color: var(--muted-color); }
        .timer-skip-btn {
          padding: 8px 14px; background: var(--border-color); color: var(--muted-color);
          border-radius: 10px; font-size: 0.75rem; font-weight: 600;
          flex-shrink: 0;
        }

        /* Feature 4: Theme */
        .theme-palettes { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
        .theme-dot {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid transparent;
          transition: transform 0.2s, border-color 0.2s;
        }
        .theme-dot.active { border-color: #fff; transform: scale(1.15); }
        .theme-dot:not(.active):hover { transform: scale(1.1); }

        /* Feature 1: Timer options */
        .timer-options { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .timer-opt-btn {
          padding: 8px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 600;
          background: var(--border-color); color: var(--muted-color);
          transition: background 0.2s, color 0.2s;
        }
        .timer-opt-btn.active { background: var(--accent-color); color: #000; }

        .settings-list { display: flex; flex-direction: column; gap: 16px; }
        .settings-section { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .settings-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
        .settings-btn { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 0.9rem; }
        .settings-btn.export { background: var(--fg-color); color: var(--bg-color); }
        .settings-btn.import { background: var(--border-color); color: var(--fg-color); border: 1px solid var(--muted-color); }
        .status-msg { padding: 12px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; text-align: center; }
        .status-msg.success { background: rgba(0, 230, 118, 0.1); color: var(--accent-color); }
        .status-msg.error { background: rgba(255, 68, 68, 0.1); color: #ff4444; }
        .settings-info { display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; font-size: 0.75rem; color: var(--muted-color); line-height: 1.4; }

        .add-btn-small { padding: 10px; background: var(--fg-color); color: var(--bg-color); border-radius: 14px; }
        .prev-info { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; font-size: 0.85rem; color: var(--muted-color); margin-bottom: 4px; }
        .record-main { display: flex; flex-direction: column; gap: 8px; }
        .pickers-group { display: flex; flex-direction: row; gap: 8px; align-items: stretch; margin-bottom: 8px; }
        .pickers-row { display: flex; gap: 6px; width: 100%; }
        .info-tip { display: flex; align-items: center; gap: 10px; padding: 12px; background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.2); border-radius: 12px; font-size: 0.75rem; color: var(--accent-color); line-height: 1.4; }
        .inbody-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
        .stat-box { display: flex; flex-direction: column; gap: 2px; }
        .stat-box .label { font-size: 0.65rem; color: var(--muted-color); }
        .stat-box .val { font-size: 0.9rem; font-weight: 700; color: var(--accent-color); }

        .actions-group-large { 
          position: sticky; bottom: 0; background: var(--bg-color); z-index: 10;
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px; 
          padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);
        }
        .large-save-btn { background: var(--fg-color); color: var(--bg-color); padding: 14px; border-radius: 14px; font-weight: 800; font-size: 0.95rem; }
        .large-finish-btn { background: var(--card-bg); color: var(--fg-color); border: 1px solid var(--border-color); padding: 14px; border-radius: 14px; font-weight: 700; font-size: 0.9rem; }
        .summary-card { width: 100%; background: var(--card-bg); border-radius: 16px; padding: 16px; margin: 12px 0; display: flex; flex-direction: column; gap: 10px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
        .main-btn { width: 100%; background: var(--border-color); padding: 14px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; }
        .back-btn { padding: 10px; background: var(--card-bg); border-radius: 14px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px); }
        .confirm-modal { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 20px; width: 85%; max-width: 300px; text-align: center; display: flex; flex-direction: column; gap: 12px; }
        .modal-actions { display: flex; gap: 12px; margin-top: 8px; }
        .modal-actions button { flex: 1; padding: 14px; border-radius: 12px; font-weight: 700; }
        .cancel-btn { background: var(--border-color); color: var(--fg-color); }
        .confirm-delete-btn { background: #ff4444; color: white; }

        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--muted-color); font-size: 0.9rem; }
        .title-area h1 { margin: 0; }
        .title-area p { margin: 0; }

        .subset-tag { display: inline-block; background: var(--border-color); padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; margin-right: 6px; margin-bottom: 4px; }
        .add-sub-btn { background: var(--accent-color); color: #000; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; }
        .add-load-btn { width: 100%; padding: 10px; border-radius: 10px; background: var(--border-color); color: var(--muted-color); font-size: 0.8rem; }
        .temp-subsets { display: flex; flex-wrap: wrap; gap: 4px; }
        .success-icon { display: flex; justify-content: center; padding: 20px 0 8px; }
        .summary-step { justify-content: center; }
        .info-group { display: flex; flex-direction: column; gap: 2px; }
        .delete-btn { padding: 6px; }

        @media (max-aspect-ratio: 1/1) {
          .home-header { padding-top: 16px; }
          .record-header { 
            min-height: 40px;
            padding: 16px 0 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
