export type Category = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
}

export interface CustomExercise extends Exercise {
  isCustom: true;
}
