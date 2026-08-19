export type Category = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'cardio';

export interface ExerciseSettings {
  exerciseId: string;
  customImage?: string;   // base64 encoded, resized to 400x400 JPEG 70%
  showName: boolean;      // false = 운동 선택 화면에서 이름 미노출
}

export interface CustomExercise extends Exercise {
  isCustom: true;
}

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

export interface Exercise {
  id: string;
  name: string;
  category: Category;
}

export interface WorkoutSession {
  exerciseId: string;
  date: string; // YYYY-MM-DD
  sets: SetRecord[];
}

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: 'chest', name: '가슴' },
  { id: 'back', name: '등' },
  { id: 'legs', name: '하체' },
  { id: 'shoulders', name: '어깨' },
  { id: 'arms', name: '팔' },
  { id: 'cardio', name: '유산소' },
];

export interface InBodyRecord {
  date: string;
  weight: number;
  skeletalMuscleMass: number;
  bodyFatPercentage: number;
}

export interface UserProfile {
  gender: 'male' | 'female' | null;
  birthYear: number | null;
}

export const DEFAULT_EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: '벤치 프레스', category: 'chest' },
  { id: 'incline-bench', name: '인클라인 벤치', category: 'chest' },
  { id: 'dumbbell-bench', name: '덤벨 벤치', category: 'chest' },
  { id: 'chest-fly', name: '체스트 플라이', category: 'chest' },
  { id: 'dips', name: '딥스', category: 'chest' },
  { id: 'pec-deck-fly', name: '펙덱 플라이', category: 'chest' },
  { id: 'push-up', name: '푸쉬업', category: 'chest' },
  // Back
  { id: 'deadlift', name: '데드리프트', category: 'back' },
  { id: 'pullup', name: '풀업', category: 'back' },
  { id: 'lat-pulldown', name: '랫 풀다운', category: 'back' },
  { id: 'seated-row', name: '시티드 로우', category: 'back' },
  { id: 'one-arm-row', name: '원암 덤벨 로우', category: 'back' },
  { id: 'barbell-row', name: '바벨 로우', category: 'back' },
  { id: 't-bar-row', name: '티바 로우', category: 'back' },
  { id: 'arm-pullover', name: '암 풀오버', category: 'back' },
  // Legs
  { id: 'squat', name: '스쿼트', category: 'legs' },
  { id: 'leg-press', name: '레그 프레스', category: 'legs' },
  { id: 'leg-extension', name: '레그 익스텐션', category: 'legs' },
  { id: 'leg-curl', name: '레그 컬', category: 'legs' },
  { id: 'lunge', name: '런지', category: 'legs' },
  { id: 'stiff-leg-deadlift', name: '스티프 데드리프트', category: 'legs' },
  { id: 'calf-raise', name: '카프 레이즈', category: 'legs' },
  // Shoulders
  { id: 'shoulder-press', name: '숄더 프레스', category: 'shoulders' },
  { id: 'military-press', name: '밀리터리 프레스', category: 'shoulders' },
  { id: 'arnold-press', name: '아놀드 프레스', category: 'shoulders' },
  { id: 'side-lateral-raise', name: '사이드 레터럴 레이즈', category: 'shoulders' },
  { id: 'face-pull', name: '페이스 풀', category: 'shoulders' },
  { id: 'front-raise', name: '프론트 레이즈', category: 'shoulders' },
  // Arms
  { id: 'biceps-curl', name: '이두 컬', category: 'arms' },
  { id: 'barbell-curl', name: '바벨 컬', category: 'arms' },
  { id: 'hammer-curl', name: '해머 컬', category: 'arms' },
  { id: 'triceps-pushdown', name: '삼두 푸쉬다운', category: 'arms' },
  { id: 'lying-triceps-extension', name: '라잉 트라이셉스', category: 'arms' },
  { id: 'dumbbell-kickback', name: '덤벨 킥백', category: 'arms' },
  // Cardio
  { id: 'treadmill', name: '런닝머신', category: 'cardio' },
  { id: 'stairmaster', name: '천국의 계단', category: 'cardio' },
  { id: 'cycle', name: '사이클', category: 'cardio' },
  { id: 'elliptical', name: '일립티컬', category: 'cardio' },
];
