import { useState, useCallback } from 'react';
import { WorkoutRepository } from '../../core/repositories/workoutRepository';
import { WorkoutService } from '../../core/services/workoutService';
import type { CustomExercise, Exercise, SetRecord, SubSet, WorkoutSession } from '../../core/types';

export const useWorkout = () => {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => WorkoutRepository.getAllSessions());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(() => WorkoutRepository.getWorkoutDates());
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>(() => WorkoutRepository.getCustomExercises());
  const [ongoingWorkouts, setOngoingWorkouts] = useState(() => WorkoutRepository.getOngoingWorkouts());

  const reload = useCallback(() => {
    setSessions([...WorkoutRepository.getAllSessions()]);
    setWorkoutDates(new Set(WorkoutRepository.getWorkoutDates()));
    setCustomExercises([...WorkoutRepository.getCustomExercises()]);
    setOngoingWorkouts({ ...WorkoutRepository.getOngoingWorkouts() });
  }, []);

  const finishWorkout = useCallback((exercise: Exercise, currentSets: SetRecord[], tempSubSets: SubSet[]) => {
    const session = WorkoutService.finishWorkout(exercise, currentSets, tempSubSets);
    if (session.sets.length > 0) {
      WorkoutRepository.saveSession(session);
    }
    
    // Clear ongoing for this exercise
    const newOngoing = { ...ongoingWorkouts };
    delete newOngoing[exercise.id];
    WorkoutRepository.saveOngoingWorkouts(newOngoing);
    
    reload();
  }, [ongoingWorkouts, reload]);

  const updateSession = useCallback((oldId: string, oldDate: string, updated: WorkoutSession) => {
    WorkoutRepository.updateSession(oldId, oldDate, updated);
    reload();
  }, [reload]);

  const deleteSession = useCallback((id: string, date: string) => {
    WorkoutRepository.deleteSession(id, date);
    reload();
  }, [reload]);

  const saveCustomExercise = useCallback((ex: CustomExercise) => {
    WorkoutRepository.saveCustomExercise(ex);
    reload();
  }, [reload]);

  const deleteCustomExercise = useCallback((id: string) => {
    WorkoutRepository.deleteCustomExercise(id);
    reload();
  }, [reload]);

  const updateOngoingWorkouts = useCallback((newWorkouts: Record<string, { sets: SetRecord[]; tempSubSets: SubSet[] }>) => {
    WorkoutRepository.saveOngoingWorkouts(newWorkouts);
    setOngoingWorkouts(newWorkouts);
  }, []);

  return {
    sessions,
    workoutDates,
    customExercises,
    ongoingWorkouts,
    finishWorkout,
    updateSession,
    deleteSession,
    saveCustomExercise,
    deleteCustomExercise,
    updateOngoingWorkouts,
    reload
  };
};
