import localforage from 'localforage';
import { StorageKeys, loadSafe } from './storageInit';
import type { ExerciseSettings, UserProfile, CategoryItem } from '../types';
import { CATEGORIES } from '../data/exercises';

const DEFAULT_CATEGORY_ITEMS: CategoryItem[] = CATEGORIES.map((c, i) => ({
  id: c.id,
  name: c.name,
  showName: true,
  isCustom: false,
  order: i,
}));

const cache = {
  settings: [] as ExerciseSettings[],
  timer: 60,
  theme: '#00E676',
  userProfile: { gender: null, birthYear: null } as UserProfile,
  categories: DEFAULT_CATEGORY_ITEMS,
  exerciseCategoryOverrides: {} as Record<string, string>
};

export const SettingsRepository = {
  init: async () => {
    cache.settings = await loadSafe(StorageKeys.SETTINGS, []);
    
    const savedTimer = await loadSafe<string | number>(StorageKeys.TIMER, 60);
    cache.timer = typeof savedTimer === 'string' ? parseInt(savedTimer, 10) : savedTimer;
    
    cache.theme = await loadSafe(StorageKeys.THEME, '#00E676');
    cache.userProfile = await loadSafe(StorageKeys.USER_PROFILE, { gender: null, birthYear: null });
    cache.categories = await loadSafe<CategoryItem[]>(StorageKeys.CATEGORIES, DEFAULT_CATEGORY_ITEMS);
    cache.exerciseCategoryOverrides = await loadSafe<Record<string, string>>(StorageKeys.CATEGORY_OVERRIDES, {});
  },

  getTimerDuration: () => cache.timer,
  saveTimerDuration: (seconds: number) => {
    cache.timer = seconds;
    localforage.setItem(StorageKeys.TIMER, cache.timer);
  },

  getTheme: () => cache.theme,
  saveTheme: (color: string) => {
    cache.theme = color;
    localforage.setItem(StorageKeys.THEME, cache.theme);
  },

  getUserProfile: () => cache.userProfile,
  saveUserProfile: (profile: UserProfile) => {
    cache.userProfile = profile;
    localforage.setItem(StorageKeys.USER_PROFILE, cache.userProfile);
  },

  getExerciseSettings: () => cache.settings,
  getExerciseSetting: (exerciseId: string) => 
    cache.settings.find(s => s.exerciseId === exerciseId) ?? { exerciseId, showName: true },
  
  saveExerciseSetting: (setting: ExerciseSettings) => {
    const idx = cache.settings.findIndex(s => s.exerciseId === setting.exerciseId);
    if (idx > -1) cache.settings[idx] = setting;
    else cache.settings.push(setting);
    localforage.setItem(StorageKeys.SETTINGS, cache.settings);
  },

  deleteExerciseSetting: (exerciseId: string) => {
    cache.settings = cache.settings.filter(s => s.exerciseId !== exerciseId);
    localforage.setItem(StorageKeys.SETTINGS, cache.settings);
  },

  setAllExerciseSettings: (settings: ExerciseSettings[]) => {
    cache.settings = settings;
    localforage.setItem(StorageKeys.SETTINGS, settings);
  },

  getCategories: () => cache.categories,
  saveCategories: (categories: CategoryItem[]) => {
    cache.categories = categories;
    localforage.setItem(StorageKeys.CATEGORIES, cache.categories);
  },

  getExerciseCategoryOverrides: () => cache.exerciseCategoryOverrides,
  saveExerciseCategoryOverride: (exerciseId: string, categoryId: string) => {
    cache.exerciseCategoryOverrides = {
      ...cache.exerciseCategoryOverrides,
      [exerciseId]: categoryId
    };
    localforage.setItem(StorageKeys.CATEGORY_OVERRIDES, cache.exerciseCategoryOverrides);
  },
  saveAllCategoryOverrides: (overrides: Record<string, string>) => {
    cache.exerciseCategoryOverrides = overrides;
    localforage.setItem(StorageKeys.CATEGORY_OVERRIDES, cache.exerciseCategoryOverrides);
  }
};
