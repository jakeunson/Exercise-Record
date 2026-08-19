import { useState, useCallback } from 'react';
import { StorageService } from '../services/storage';
import type { ExerciseSettings } from '../types';

export const useSettingsState = () => {
  const [timerDuration, setTimerDuration] = useState<number>(() => StorageService.getTimerDuration());
  const [accentColor, setAccentColor] = useState<string>(() => StorageService.getTheme());
  const [exerciseSettings, setExerciseSettings] = useState<ExerciseSettings[]>(() => StorageService.getExerciseSettings());
  const [userProfile, setUserProfile] = useState(() => StorageService.getUserProfile());

  const updateTimerDuration = useCallback((duration: number) => {
    StorageService.saveTimerDuration(duration);
    setTimerDuration(duration);
  }, []);

  const updateAccentColor = useCallback((color: string) => {
    StorageService.saveTheme(color);
    setAccentColor(color);
  }, []);

  const updateUserProfile = useCallback((profile: { gender: 'male' | 'female' | null, birthYear: number | null }) => {
    StorageService.saveUserProfile(profile);
    setUserProfile(profile);
  }, []);

  const saveExerciseSetting = useCallback((setting: ExerciseSettings) => {
    StorageService.saveExerciseSetting(setting);
    setExerciseSettings(StorageService.getExerciseSettings());
  }, []);

  const reloadSettings = useCallback(() => {
    setExerciseSettings(StorageService.getExerciseSettings());
  }, []);

  return {
    timerDuration,
    updateTimerDuration,
    accentColor,
    updateAccentColor,
    userProfile,
    updateUserProfile,
    exerciseSettings,
    saveExerciseSetting,
    reloadSettings
  };
};
