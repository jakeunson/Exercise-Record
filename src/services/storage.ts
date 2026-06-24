import localforage from 'localforage';
import type { WorkoutSession, SetRecord, InBodyRecord, ExerciseSettings, CustomExercise, SubSet } from '../types';

const KEYS = {
  SESSIONS: 'workout_records',
  INBODY: 'inbody_history',
  SETTINGS: 'exercise_settings',
  CUSTOM_EXERCISES: 'custom_exercises',
  TIMER: 'timer_duration',
  THEME: 'accent_theme',
  ONGOING: 'ongoing_workouts_state'
};

// Hybrid Cache
const cache = {
  sessions: [] as WorkoutSession[],
  inBody: [] as InBodyRecord[],
  settings: [] as ExerciseSettings[],
  customExercises: [] as CustomExercise[],
  timer: 60,
  theme: '#00E676',
  ongoing: {} as Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>
};

export const StorageService = {
  isInitialized: false,

  init: async () => {
    if (StorageService.isInitialized) return;

    // Optional Migration from localStorage
    for (const key of Object.values(KEYS)) {
      const old = localStorage.getItem(key);
      if (old !== null) {
        let parsed;
        try {
          parsed = JSON.parse(old);
        } catch {
          parsed = old; // strings like timer or theme
        }
        await localforage.setItem(key, parsed);
        localStorage.removeItem(key);
      }
    }

    // Load into cache
    const loadSafe = async <T>(key: string, defaultVal: T): Promise<T> => {
      try {
        const val = await localforage.getItem<T>(key);
        return val !== null ? val : defaultVal;
      } catch (e) {
        console.error(`Failed to load ${key}`, e);
        return defaultVal;
      }
    };

    cache.sessions = await loadSafe(KEYS.SESSIONS, []);
    cache.inBody = await loadSafe(KEYS.INBODY, []);
    cache.settings = await loadSafe(KEYS.SETTINGS, []);
    cache.customExercises = await loadSafe(KEYS.CUSTOM_EXERCISES, []);
    
    const savedTimer = await loadSafe<string | number>(KEYS.TIMER, 60);
    cache.timer = typeof savedTimer === 'string' ? parseInt(savedTimer, 10) : savedTimer;
    
    cache.theme = await loadSafe(KEYS.THEME, '#00E676');
    cache.ongoing = await loadSafe(KEYS.ONGOING, {});

    StorageService.isInitialized = true;
  },

  // Getters (Synchronous from Cache)
  getSessions: () => cache.sessions,
  getInBodyHistory: () => cache.inBody,
  getTimerDuration: () => cache.timer,
  getTheme: () => cache.theme,
  getExerciseSettings: () => cache.settings,
  getExerciseSetting: (exerciseId: string) => cache.settings.find(s => s.exerciseId === exerciseId) ?? { exerciseId, showName: true },
  getCustomExercises: () => cache.customExercises,
  getOngoingWorkouts: () => cache.ongoing,
  getWorkoutDates: () => new Set(cache.sessions.map(s => s.date)),

  getPreviousSetRecord: (exerciseId: string, setIndex: number): SetRecord | null => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const pastSessions = cache.sessions
      .filter(s => s.exerciseId === exerciseId && s.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return pastSessions.length > 0 ? (pastSessions[0].sets[setIndex] || null) : null;
  },

  getLatestSession: (exerciseId: string): WorkoutSession | null => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const pastSessions = cache.sessions
      .filter(s => s.exerciseId === exerciseId && s.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return pastSessions.length > 0 ? pastSessions[0] : null;
  },

  // Setters (Synchronous Cache + Asynchronous DB)
  saveSession: (session: WorkoutSession) => {
    const existingIndex = cache.sessions.findIndex(s => s.exerciseId === session.exerciseId && s.date === session.date);
    if (existingIndex > -1) cache.sessions[existingIndex] = session;
    else cache.sessions.push(session);
    localforage.setItem(KEYS.SESSIONS, cache.sessions);
  },

  updateSession: (oldExerciseId: string, oldDate: string, updated: WorkoutSession) => {
    cache.sessions = cache.sessions.filter(s => !(s.exerciseId === oldExerciseId && s.date === oldDate));
    const existingIndex = cache.sessions.findIndex(s => s.exerciseId === updated.exerciseId && s.date === updated.date);
    if (existingIndex > -1) cache.sessions[existingIndex] = updated;
    else cache.sessions.push(updated);
    localforage.setItem(KEYS.SESSIONS, cache.sessions);
  },

  deleteSession: (exerciseId: string, date: string) => {
    cache.sessions = cache.sessions.filter(s => !(s.exerciseId === exerciseId && s.date === date));
    localforage.setItem(KEYS.SESSIONS, cache.sessions);
  },

  saveInBody: (record: InBodyRecord) => {
    const updated = [record, ...cache.inBody.filter(r => r.date !== record.date)];
    cache.inBody = updated.sort((a, b) => b.date.localeCompare(a.date));
    localforage.setItem(KEYS.INBODY, cache.inBody);
  },

  updateInBody: (oldDate: string, record: InBodyRecord) => {
    let history = cache.inBody.filter(r => r.date !== oldDate && r.date !== record.date);
    cache.inBody = [record, ...history].sort((a, b) => b.date.localeCompare(a.date));
    localforage.setItem(KEYS.INBODY, cache.inBody);
  },

  deleteInBody: (date: string) => {
    cache.inBody = cache.inBody.filter(r => r.date !== date);
    localforage.setItem(KEYS.INBODY, cache.inBody);
  },

  saveTimerDuration: (seconds: number) => {
    cache.timer = seconds;
    localforage.setItem(KEYS.TIMER, cache.timer);
  },

  saveTheme: (color: string) => {
    cache.theme = color;
    localforage.setItem(KEYS.THEME, cache.theme);
  },

  saveExerciseSetting: (setting: ExerciseSettings) => {
    const idx = cache.settings.findIndex(s => s.exerciseId === setting.exerciseId);
    if (idx > -1) cache.settings[idx] = setting;
    else cache.settings.push(setting);
    localforage.setItem(KEYS.SETTINGS, cache.settings);
  },

  saveCustomExercise: (exercise: CustomExercise) => {
    const idx = cache.customExercises.findIndex(e => e.id === exercise.id);
    if (idx > -1) cache.customExercises[idx] = exercise;
    else cache.customExercises.push(exercise);
    localforage.setItem(KEYS.CUSTOM_EXERCISES, cache.customExercises);
  },

  deleteCustomExercise: (exerciseId: string) => {
    cache.customExercises = cache.customExercises.filter(e => e.id !== exerciseId);
    localforage.setItem(KEYS.CUSTOM_EXERCISES, cache.customExercises);
    cache.settings = cache.settings.filter(s => s.exerciseId !== exerciseId);
    localforage.setItem(KEYS.SETTINGS, cache.settings);
  },

  saveOngoingWorkouts: (state: Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>) => {
    cache.ongoing = state;
    localforage.setItem(KEYS.ONGOING, cache.ongoing);
  },

  exportData: () => {
    return JSON.stringify({
      workout_records: JSON.stringify(cache.sessions),
      inbody_history: JSON.stringify(cache.inBody),
      version: '1.0.0',
      timestamp: Date.now()
    });
  },

  importData: async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.workout_records) {
        cache.sessions = JSON.parse(data.workout_records);
        await localforage.setItem(KEYS.SESSIONS, cache.sessions);
      }
      if (data.inbody_history) {
        cache.inBody = JSON.parse(data.inbody_history);
        await localforage.setItem(KEYS.INBODY, cache.inBody);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
