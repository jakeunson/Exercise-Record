import { useState, useCallback } from 'react';
import { StorageService } from '../services/storage';
import type { WorkoutSession } from '../types';

export const useHistoryState = () => {
  const [historySessions, setHistorySessions] = useState<WorkoutSession[]>(() => StorageService.getSessions());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(() => StorageService.getWorkoutDates());

  const saveSession = useCallback((session: WorkoutSession) => {
    StorageService.saveSession(session);
    setHistorySessions(StorageService.getSessions());
    setWorkoutDates(StorageService.getWorkoutDates());
  }, []);

  const updateSession = useCallback((oldExerciseId: string, oldDate: string, updated: WorkoutSession) => {
    StorageService.updateSession(oldExerciseId, oldDate, updated);
    setHistorySessions(StorageService.getSessions());
    setWorkoutDates(StorageService.getWorkoutDates());
  }, []);

  const deleteSession = useCallback((exerciseId: string, date: string) => {
    StorageService.deleteSession(exerciseId, date);
    setHistorySessions(StorageService.getSessions());
    setWorkoutDates(StorageService.getWorkoutDates());
  }, []);

  const reloadHistory = useCallback(() => {
    setHistorySessions(StorageService.getSessions());
    setWorkoutDates(StorageService.getWorkoutDates());
  }, []);

  return {
    historySessions,
    workoutDates,
    saveSession,
    updateSession,
    deleteSession,
    reloadHistory
  };
};
