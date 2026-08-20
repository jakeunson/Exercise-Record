import { useState, useCallback } from 'react';
import { SettingsRepository } from '../../core/repositories/settingsRepository';
import { ThemeService } from '../../core/services/themeService';
import type { ExerciseSettings, UserProfile } from '../../core/types';

export const useSettings = () => {
  const [timerDuration, setTimerDuration] = useState<number>(() => SettingsRepository.getTimerDuration());
  const [accentColor, setAccentColor] = useState<string>(() => SettingsRepository.getTheme());
  const [exerciseSettings, setExerciseSettings] = useState<ExerciseSettings[]>(() => SettingsRepository.getExerciseSettings());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => SettingsRepository.getUserProfile());

  const reload = useCallback(() => {
    setTimerDuration(SettingsRepository.getTimerDuration());
    setAccentColor(SettingsRepository.getTheme());
    setExerciseSettings([...SettingsRepository.getExerciseSettings()]);
    setUserProfile({ ...SettingsRepository.getUserProfile() });
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

  return {
    timerDuration,
    updateTimerDuration,
    accentColor,
    updateAccentColor,
    userProfile,
    updateUserProfile,
    exerciseSettings,
    saveExerciseSetting,
    reload
  };
};
