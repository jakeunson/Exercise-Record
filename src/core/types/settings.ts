export interface ExerciseSettings {
  exerciseId: string;
  customName?: string;    // Override name for any exercise
  customImage?: string;   // base64 encoded, resized to 400x400 JPEG 70%
  showName: boolean;      // false = 운동 선택 화면에서 이름 미노출
}

export interface UserProfile {
  gender: 'male' | 'female' | null;
  birthYear: number | null;
}
