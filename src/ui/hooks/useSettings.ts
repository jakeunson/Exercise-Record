import { useState, useCallback } from 'react';
import { SettingsRepository } from '../../core/repositories/settingsRepository';
import { ThemeService } from '../../core/services/themeService';
import type { ExerciseSettings, UserProfile } from '../../core/types';

export const useSettings = () => {
  const [timerDuration, setTimerDuration] = useState<number>(() => SettingsRepository.getTimerDuration());
  const [accentColor, setAccentColor] = useState<string>(() => SettingsRepository.getTheme());
  const [exerciseSettings, setExerciseSettings] = useState<ExerciseSettings[]>(() => SettingsRepository.getExerciseSettings());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => SettingsRepository.getUserProfile());
  const [categories, setCategories] = useState(() => SettingsRepository.getCategories());
  const [exerciseCategoryOverrides, setExerciseCategoryOverrides] = useState(() => SettingsRepository.getExerciseCategoryOverrides());

  const reload = useCallback(() => {
    setTimerDuration(SettingsRepository.getTimerDuration());
    setAccentColor(SettingsRepository.getTheme());
    setExerciseSettings([...SettingsRepository.getExerciseSettings()]);
    setUserProfile({ ...SettingsRepository.getUserProfile() });
    setCategories([...SettingsRepository.getCategories()]);
    setExerciseCategoryOverrides({ ...SettingsRepository.getExerciseCategoryOverrides() });
  }, []);

  const updateTimerDuration = useCallback((duration: number) => {
    SettingsRepository.saveTimerDuration(duration);
    setTimerDuration(duration);
  }, []);

  const updateAccentColor = useCallback((color: string) => {
    SettingsRepository.saveTheme(color);
    setAccentColor(color);
    ThemeService.applyTheme(color);
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    SettingsRepository.saveUserProfile(profile);
    setUserProfile(profile);
  }, []);

  const saveExerciseSetting = useCallback((setting: ExerciseSettings) => {
    SettingsRepository.saveExerciseSetting(setting);
    reload();
  }, [reload]);

  const saveCategories = useCallback((cats: any[]) => {
    SettingsRepository.saveCategories(cats);
    reload();
  }, [reload]);

  const saveCategoryOverride = useCallback((exerciseId: string, categoryId: string) => {
    SettingsRepository.saveExerciseCategoryOverride(exerciseId, categoryId);
    reload();
  }, [reload]);

  return {
    timerDuration,
    updateTimerDuration,
    accentColor,
    updateAccentColor,
    userProfile,
    updateUserProfile,
    exerciseSettings,
    saveExerciseSetting,
    categories,
    saveCategories,
    exerciseCategoryOverrides,
    saveCategoryOverride,
    reload
  };
};
