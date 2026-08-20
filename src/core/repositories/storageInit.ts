import localforage from 'localforage';

const KEYS = {
  SESSIONS: 'workout_records',
  INBODY: 'inbody_history',
  SETTINGS: 'exercise_settings',
  CUSTOM_EXERCISES: 'custom_exercises',
  TIMER: 'timer_duration',
  THEME: 'accent_theme',
  ONGOING: 'ongoing_workouts_state',
  USER_PROFILE: 'user_profile',
  CATEGORIES: 'custom_categories',
  CATEGORY_OVERRIDES: 'exercise_category_overrides'
};

export const StorageKeys = KEYS;

export const loadSafe = async <T>(key: string, defaultVal: T): Promise<T> => {
  try {
    const val = await localforage.getItem<T>(key);
    return val !== null ? val : defaultVal;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return defaultVal;
  }
};

export const runMigrations = async () => {
  for (const key of Object.values(KEYS)) {
    const old = localStorage.getItem(key);
    if (old !== null) {
      let parsed;
      try {
        parsed = JSON.parse(old);
      } catch {
        parsed = old;
      }
      await localforage.setItem(key, parsed);
      localStorage.removeItem(key);
    }
  }
};
