export interface SubSet {
  weight: number;
  reps: number;
}

export interface SetRecord {
  subSets: SubSet[];
  timestamp: number;
  // For cardio
  distance?: number;
  time?: number;
  calories?: number;
}

export interface WorkoutSession {
  exerciseId: string;
  date: string; // YYYY-MM-DD
  sets: SetRecord[];
}
