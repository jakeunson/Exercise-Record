import type { Exercise, SetRecord, SubSet, WorkoutSession } from '../types';
import { WorkoutRepository } from '../repositories/workoutRepository';

export const WorkoutService = {
  finishWorkout: (exercise: Exercise, sets: SetRecord[], tempSubSets: SubSet[]): WorkoutSession => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    
    let finalSets = [...sets];
    if (tempSubSets.length > 0) {
      finalSets.push({
        subSets: tempSubSets,
        timestamp: Date.now()
      });
    }

    const validSets = finalSets.filter(s => 
      exercise.category === 'cardio' ? true : s.subSets.some(ss => ss.reps > 0)
    );

    return {
      exerciseId: exercise.id,
      date: today,
      sets: validSets
    };
  },

  getPreviousSetRecord: (exerciseId: string, setIndex: number): SetRecord | null => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const pastSessions = WorkoutRepository.getAllSessions()
      .filter(s => s.exerciseId === exerciseId && s.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
      
    return pastSessions.length > 0 ? (pastSessions[0].sets[setIndex] || null) : null;
  },

  getLatestSession: (exerciseId: string): WorkoutSession | null => {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
    const pastSessions = WorkoutRepository.getAllSessions()
      .filter(s => s.exerciseId === exerciseId && s.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
      
    return pastSessions.length > 0 ? pastSessions[0] : null;
  }
};
