import { UserProfile, Goal, TrainingProgress, WeeklyTrainings, Achievement } from '../types';
import { 
  syncUserProfile, 
  syncGoal, 
  syncTrainingProgress, 
  syncAchievements,
  loadAllData,
  getCurrentUser,
  checkConnectivity
} from './cloudStorage';

const STORAGE_KEYS = {
  USER_PROFILE: 'running_trainer_user_profile',
  GOAL: 'running_trainer_goal',
  TRAINING_PROGRESS: 'running_trainer_progress',
  WEEKLY_TRAININGS: 'running_trainer_weekly',
  ACHIEVEMENTS: 'running_trainer_achievements',
  CURRENT_WEEK: 'running_trainer_current_week',
  PENDING_SYNC: 'running_trainer_pending_sync'
};

// Marcar dados como pendentes de sincronização
const markPendingSync = (dataType: string) => {
  const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
  if (!pending.includes(dataType)) {
    pending.push(dataType);
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
  }
};

// Remover da lista de pendentes
const removePendingSync = (dataType: string) => {
  const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
  const updated = pending.filter((item: string) => item !== dataType);
  localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updated));
};

// Sincronizar dados pendentes
export const syncPendingData = async (): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user || !checkConnectivity()) return false;

  const pending = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
  if (pending.length === 0) return true;

  try {
    const profile = getUserProfile();
    const goal = getGoal();
    const progress = getTrainingProgress();
    const achievements = getAchievements();

    const results = await Promise.all([
      profile && pending.includes('profile') ? syncUserProfile(profile) : Promise.resolve(true),
      goal && pending.includes('goal') ? syncGoal(goal) : Promise.resolve(true),
      pending.includes('progress') ? syncTrainingProgress(progress) : Promise.resolve(true),
      pending.includes('achievements') ? syncAchievements(achievements) : Promise.resolve(true)
    ]);

    if (results.every(result => result)) {
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, '[]');
      localStorage.setItem('running_trainer_last_sync', new Date().toISOString());
      return true;
    }
  } catch (error) {
    console.error('Erro na sincronização pendente:', error);
  }

  return false;
};

// Carregar dados da nuvem se disponível
export const loadCloudDataIfAvailable = async (): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user || !checkConnectivity()) return false;

  try {
    const cloudData = await loadAllData();
    
    if (cloudData.profile) {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(cloudData.profile));
    }
    if (cloudData.goal) {
      localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(cloudData.goal));
    }
    if (cloudData.progress.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(cloudData.progress));
    }
    if (cloudData.achievements.length > 0) {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(cloudData.achievements));
    }

    localStorage.setItem('running_trainer_last_sync', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Erro ao carregar dados da nuvem:', error);
    return false;
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  
  // Tentar sincronizar imediatamente
  if (getCurrentUser() && checkConnectivity()) {
    syncUserProfile(profile).catch(() => markPendingSync('profile'));
  } else {
    markPendingSync('profile');
  }
};

export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
};

export const saveGoal = (goal: Goal): void => {
  localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
  
  if (getCurrentUser() && checkConnectivity()) {
    syncGoal(goal).catch(() => markPendingSync('goal'));
  } else {
    markPendingSync('goal');
  }
};

export const getGoal = (): Goal | null => {
  const data = localStorage.getItem(STORAGE_KEYS.GOAL);
  return data ? JSON.parse(data) : null;
};

export const saveTrainingProgress = (progress: TrainingProgress[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRAINING_PROGRESS, JSON.stringify(progress));
  
  if (getCurrentUser() && checkConnectivity()) {
    syncTrainingProgress(progress).catch(() => markPendingSync('progress'));
  } else {
    markPendingSync('progress');
  }
};

export const getTrainingProgress = (): TrainingProgress[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRAINING_PROGRESS);
  return data ? JSON.parse(data) : [];
};

export const saveWeeklyTrainings = (weekly: WeeklyTrainings): void => {
  localStorage.setItem(STORAGE_KEYS.WEEKLY_TRAININGS, JSON.stringify(weekly));
};

export const getWeeklyTrainings = (): WeeklyTrainings => {
  const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_TRAININGS);
  return data ? JSON.parse(data) : { longa: 0, intervalado: 0, weekStart: new Date() };
};

export const saveAchievements = (achievements: Achievement[]): void => {
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  
  if (getCurrentUser() && checkConnectivity()) {
    syncAchievements(achievements).catch(() => markPendingSync('achievements'));
  } else {
    markPendingSync('achievements');
  }
};

export const getAchievements = (): Achievement[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
  return data ? JSON.parse(data) : [];
};

export const saveCurrentWeek = (week: number): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_WEEK, week.toString());
};

export const getCurrentWeek = (): number => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_WEEK);
  return data ? parseInt(data) : 1;
};