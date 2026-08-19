import { useState, useCallback } from 'react';
import { StorageService } from '../services/storage';
import type { CustomExercise, SetRecord, SubSet } from '../types';

export const useWorkoutState = () => {
  const [ongoingWorkouts, setOngoingWorkouts] = useState<Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>>(() => StorageService.getOngoingWorkouts());
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>(() => StorageService.getCustomExercises());

  const updateOngoingWorkouts = useCallback((newWorkouts: Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>) => {
    StorageService.saveOngoingWorkouts(newWorkouts);
    setOngoingWorkouts(newWorkouts);
  }, []);

  const saveCustomExercise = useCallback((newEx: CustomExercise) => {
    StorageService.saveCustomExercise(newEx);
    setCustomExercises(StorageService.getCustomExercises());
  }, []);

  const reloadCustomExercises = useCallback(() => {
    setCustomExercises(StorageService.getCustomExercises());
  }, []);

  const reloadOngoingWorkouts = useCallback(() => {
    setOngoingWorkouts({ ...StorageService.getOngoingWorkouts() });
  }, []);

  return {
    ongoingWorkouts,
    updateOngoingWorkouts,
    customExercises,
    saveCustomExercise,
    reloadCustomExercises,
    reloadOngoingWorkouts
  };
};
