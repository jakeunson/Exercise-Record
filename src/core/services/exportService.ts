import { WorkoutRepository, InBodyRepository, SettingsRepository } from '../repositories';

export const ExportService = {
  exportData: (): string => {
    const data = {
      version: 2,
      sessions: WorkoutRepository.getAllSessions(),
      inBody: InBodyRepository.getAll(),
      settings: SettingsRepository.getExerciseSettings(),
      customExercises: WorkoutRepository.getCustomExercises(),
      timer: SettingsRepository.getTimerDuration(),
      theme: SettingsRepository.getTheme(),
      userProfile: SettingsRepository.getUserProfile(),
      categories: SettingsRepository.getCategories(),
      exerciseCategoryOverrides: SettingsRepository.getExerciseCategoryOverrides(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data);
  },

  importData: async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.sessions || !Array.isArray(parsed.sessions)) return false;
      
      WorkoutRepository.setAllSessions(parsed.sessions);
      if (parsed.inBody) InBodyRepository.setAll(parsed.inBody);
      if (parsed.settings) SettingsRepository.setAllExerciseSettings(parsed.settings);
      if (parsed.customExercises) WorkoutRepository.setCustomExercises(parsed.customExercises);
      if (parsed.timer) SettingsRepository.saveTimerDuration(parsed.timer);
      if (parsed.theme) SettingsRepository.saveTheme(parsed.theme);
      if (parsed.userProfile) SettingsRepository.saveUserProfile(parsed.userProfile);
      if (parsed.categories) SettingsRepository.saveCategories(parsed.categories);
      if (parsed.exerciseCategoryOverrides) SettingsRepository.saveAllCategoryOverrides(parsed.exerciseCategoryOverrides);
      
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
