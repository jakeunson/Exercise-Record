export type Category = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'cardio';

export interface CategoryItem {
  id: string;
  name: string;
  customImage?: string;
  showName?: boolean;
  isCustom?: boolean;
  order?: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: Category | string;
}

export interface CustomExercise extends Exercise {
  isCustom: true;
}
