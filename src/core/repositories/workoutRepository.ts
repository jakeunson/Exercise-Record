import localforage from 'localforage';
import { StorageKeys, loadSafe } from './storageInit';
import type { WorkoutSession, CustomExercise, SetRecord, SubSet } from '../types';

const cache = {
  sessions: [] as WorkoutSession[],
  customExercises: [] as CustomExercise[],
  ongoing: {} as Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>,
  ongoingDate: '' as string,
};

export const WorkoutRepository = {
  init: async () => {
    cache.sessions = await loadSafe(StorageKeys.SESSIONS, []);
    cache.customExercises = await loadSafe(StorageKeys.CUSTOM_EXERCISES, []);
    
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const rawOngoing = await loadSafe<any>(StorageKeys.ONGOING, null);
    
    if (rawOngoing) {
      if (rawOngoing.date && rawOngoing.state) {
        if (rawOngoing.date === today) {
          cache.ongoing = rawOngoing.state;
          cache.ongoingDate = today;
        } else {
          cache.ongoing = {};
          cache.ongoingDate = today;
          await localforage.setItem(StorageKeys.ONGOING, { date: today, state: {} });
        }
      } else {
        cache.ongoing = rawOngoing;
        cache.ongoingDate = today;
        await localforage.setItem(StorageKeys.ONGOING, { date: today, state: rawOngoing });
      }
    } else {
      cache.ongoing = {};
      cache.ongoingDate = today;
    }
  },

  getAllSessions: () => cache.sessions,
  getWorkoutDates: () => new Set(cache.sessions.map(s => s.date)),
  
  saveSession: (session: WorkoutSession) => {
    const existingIndex = cache.sessions.findIndex(s => s.exerciseId === session.exerciseId && s.date === session.date);
    const newSessions = [...cache.sessions];
    if (existingIndex > -1) newSessions[existingIndex] = session;
    else newSessions.push(session);
    cache.sessions = newSessions;
    localforage.setItem(StorageKeys.SESSIONS, cache.sessions);
  },

  updateSession: (oldExerciseId: string, oldDate: string, updated: WorkoutSession) => {
    let newSessions = cache.sessions.filter(s => !(s.exerciseId === oldExerciseId && s.date === oldDate));
    const existingIndex = newSessions.findIndex(s => s.exerciseId === updated.exerciseId && s.date === updated.date);
    if (existingIndex > -1) newSessions[existingIndex] = updated;
    else newSessions.push(updated);
    cache.sessions = newSessions;
    localforage.setItem(StorageKeys.SESSIONS, cache.sessions);
  },

  deleteSession: (exerciseId: string, date: string) => {
    cache.sessions = cache.sessions.filter(s => !(s.exerciseId === exerciseId && s.date === date));
    localforage.setItem(StorageKeys.SESSIONS, cache.sessions);
  },

  getCustomExercises: () => cache.customExercises,
  
  saveCustomExercise: (exercise: CustomExercise) => {
    const idx = cache.customExercises.findIndex(e => e.id === exercise.id);
    if (idx > -1) cache.customExercises[idx] = exercise;
    else cache.customExercises.push(exercise);
    localforage.setItem(StorageKeys.CUSTOM_EXERCISES, cache.customExercises);
  },

  deleteCustomExercise: (id: string) => {
    cache.customExercises = cache.customExercises.filter(e => e.id !== id);
    localforage.setItem(StorageKeys.CUSTOM_EXERCISES, cache.customExercises);
  },

  getOngoingWorkouts: () => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    if (cache.ongoingDate && cache.ongoingDate !== today) {
      cache.ongoing = {};
      cache.ongoingDate = today;
      localforage.setItem(StorageKeys.ONGOING, { date: today, state: {} });
    }
    return cache.ongoing;
  },

  saveOngoingWorkouts: (state: Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>) => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    cache.ongoing = state;
    cache.ongoingDate = today;
    localforage.setItem(StorageKeys.ONGOING, { date: today, state });
  },

  // Added for export/import compatibility
  setAllSessions: (sessions: WorkoutSession[]) => {
    cache.sessions = sessions;
    localforage.setItem(StorageKeys.SESSIONS, sessions);
  },
  
  setCustomExercises: (exercises: CustomExercise[]) => {
    cache.customExercises = exercises;
    localforage.setItem(StorageKeys.CUSTOM_EXERCISES, exercises);
  }
};
