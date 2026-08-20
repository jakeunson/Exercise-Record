import { runMigrations } from './storageInit';
import { WorkoutRepository } from './workoutRepository';
import { InBodyRepository } from './inbodyRepository';
import { SettingsRepository } from './settingsRepository';

let isInitialized = false;

export const initStorage = async () => {
  if (isInitialized) return;
  
  await runMigrations();
  await Promise.all([
    WorkoutRepository.init(),
    InBodyRepository.init(),
    SettingsRepository.init()
  ]);
  
  isInitialized = true;
};

export { WorkoutRepository } from './workoutRepository';
export { InBodyRepository } from './inbodyRepository';
export { SettingsRepository } from './settingsRepository';
