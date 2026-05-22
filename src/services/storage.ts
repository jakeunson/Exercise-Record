import type { WorkoutSession, SetRecord, InBodyRecord, ExerciseSettings, CustomExercise } from '../types';

const STORAGE_KEY = 'workout_records';
const EXERCISE_SETTINGS_KEY = 'exercise_settings';
const CUSTOM_EXERCISES_KEY = 'custom_exercises';
const TIMER_DURATION_KEY = 'timer_duration';
const THEME_KEY = 'accent_theme';

export const StorageService = {
  getSessions: (): WorkoutSession[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: WorkoutSession) => {
    const sessions = StorageService.getSessions();
    const existingIndex = sessions.findIndex(
      (s) => s.exerciseId === session.exerciseId && s.date === session.date
    );

    if (existingIndex > -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  deleteSession: (exerciseId: string, date: string) => {
    const sessions = StorageService.getSessions();
    const filtered = sessions.filter(
      (s) => !(s.exerciseId === exerciseId && s.date === date)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // InBody
  saveInBody: (record: InBodyRecord) => {
    const history = StorageService.getInBodyHistory();
    const updated = [record, ...history.filter(r => r.date !== record.date)];
    localStorage.setItem('inbody_history', JSON.stringify(updated));
  },

  getInBodyHistory: (): InBodyRecord[] => {
    const saved = localStorage.getItem('inbody_history');
    return saved ? JSON.parse(saved) : [];
  },

  deleteInBody: (date: string) => {
    const history = StorageService.getInBodyHistory();
    const filtered = history.filter(r => r.date !== date);
    localStorage.setItem('inbody_history', JSON.stringify(filtered));
  },

  getPreviousSetRecord: (exerciseId: string, setIndex: number): SetRecord | null => {
    const sessions = StorageService.getSessions();
    const today = new Date().toISOString().split('T')[0];

    const pastSessions = sessions
      .filter((s) => s.exerciseId === exerciseId && s.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (pastSessions.length > 0) {
      const lastSession = pastSessions[0];
      return lastSession.sets[setIndex] || null;
    }

    return null;
  },

  // Export/Import
  exportData: () => {
    const data = {
      workout_records: localStorage.getItem(STORAGE_KEY),
      inbody_history: localStorage.getItem('inbody_history'),
      version: '1.0.0',
      timestamp: Date.now()
    };
    return JSON.stringify(data);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.workout_records) localStorage.setItem(STORAGE_KEY, data.workout_records);
      if (data.inbody_history) localStorage.setItem('inbody_history', data.inbody_history);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // Timer Duration
  getTimerDuration: (): number => {
    const saved = localStorage.getItem(TIMER_DURATION_KEY);
    return saved !== null ? parseInt(saved, 10) : 60;
  },

  saveTimerDuration: (seconds: number) => {
    localStorage.setItem(TIMER_DURATION_KEY, String(seconds));
  },

  // Theme
  getTheme: (): string => {
    return localStorage.getItem(THEME_KEY) || '#00E676';
  },

  saveTheme: (color: string) => {
    localStorage.setItem(THEME_KEY, color);
  },

  // Exercise Settings (image + name visibility for all exercises)
  getExerciseSettings: (): ExerciseSettings[] => {
    const saved = localStorage.getItem(EXERCISE_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveExerciseSetting: (setting: ExerciseSettings) => {
    const all = StorageService.getExerciseSettings();
    const idx = all.findIndex(s => s.exerciseId === setting.exerciseId);
    if (idx > -1) all[idx] = setting;
    else all.push(setting);
    localStorage.setItem(EXERCISE_SETTINGS_KEY, JSON.stringify(all));
  },

  getExerciseSetting: (exerciseId: string): ExerciseSettings => {
    const all = StorageService.getExerciseSettings();
    return all.find(s => s.exerciseId === exerciseId) ?? { exerciseId, showName: true };
  },

  // Custom Exercises
  getCustomExercises: (): CustomExercise[] => {
    const saved = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveCustomExercise: (exercise: CustomExercise) => {
    const all = StorageService.getCustomExercises();
    const idx = all.findIndex(e => e.id === exercise.id);
    if (idx > -1) all[idx] = exercise;
    else all.push(exercise);
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(all));
  },

  deleteCustomExercise: (exerciseId: string) => {
    const all = StorageService.getCustomExercises();
    const filtered = all.filter(e => e.id !== exerciseId);
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filtered));
    // Also remove its settings
    const settings = StorageService.getExerciseSettings().filter(s => s.exerciseId !== exerciseId);
    localStorage.setItem(EXERCISE_SETTINGS_KEY, JSON.stringify(settings));
  },

  // Workout dates for calendar
  getWorkoutDates: (): Set<string> => {
    const sessions = StorageService.getSessions();
    return new Set(sessions.map(s => s.date));
  },
};
