import { supabase } from '../lib/supabase';
import { UserProfile, Goal, TrainingProgress, Achievement } from '../types';

// Verificar se o usuário está autenticado
export const getCurrentUser = () => {
  const email = localStorage.getItem('running_trainer_user_email');
  const name = localStorage.getItem('running_trainer_user_name');
  return email ? { email, name } : null;
};

// Gerar ID único baseado no email
const getUserId = (email: string): string => {
  return btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
};

// Sincronizar perfil do usuário
export const syncUserProfile = async (profile: UserProfile): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    const userId = getUserId(user.email);
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: user.email,
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        level: profile.level || 'iniciante',
        updated_at: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('Erro ao sincronizar perfil:', error);
    return false;
  }
};

// Carregar perfil do usuário da nuvem
export const loadUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    const userId = getUserId(user.email);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      name: data.name,
      age: data.age,
      weight: data.weight,
      height: data.height,
      level: data.level as any
    };
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    return null;
  }
};

// Sincronizar meta
export const syncGoal = async (goal: Goal): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    const userId = getUserId(user.email);
    
    const { error } = await supabase
      .from('goals')
      .upsert({
        user_id: userId,
        type: goal.type,
        distance: goal.distance,
        months: goal.months,
        updated_at: new Date().toISOString()
      });

    return !error;
  } catch (error) {
    console.error('Erro ao sincronizar meta:', error);
    return false;
  }
};

// Carregar meta da nuvem
export const loadGoal = async (): Promise<Goal | null> => {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    const userId = getUserId(user.email);
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      type: data.type as any,
      distance: data.distance,
      months: data.months
    };
  } catch (error) {
    console.error('Erro ao carregar meta:', error);
    return null;
  }
};

// Sincronizar progresso de treinos
export const syncTrainingProgress = async (progress: TrainingProgress[]): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    const userId = getUserId(user.email);
    
    // Preparar dados para inserção
    const trainingData = progress.map(training => ({
      id: training.id,
      user_id: userId,
      date: new Date(training.date).toISOString(),
      pace: training.pace,
      distance: training.distance,
      type: training.type,
      duration: training.duration,
      difficulty: training.difficulty || null
    }));

    const { error } = await supabase
      .from('training_progress')
      .upsert(trainingData);

    return !error;
  } catch (error) {
    console.error('Erro ao sincronizar treinos:', error);
    return false;
  }
};

// Carregar progresso de treinos da nuvem
export const loadTrainingProgress = async (): Promise<TrainingProgress[]> => {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    const userId = getUserId(user.email);
    
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map(training => ({
      id: training.id,
      date: new Date(training.date),
      pace: training.pace,
      distance: training.distance,
      type: training.type as any,
      duration: training.duration,
      difficulty: training.difficulty as any
    }));
  } catch (error) {
    console.error('Erro ao carregar treinos:', error);
    return [];
  }
};

// Sincronizar conquistas
export const syncAchievements = async (achievements: Achievement[]): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;

    const userId = getUserId(user.email);
    
    const achievementData = achievements.map(achievement => ({
      id: achievement.id,
      user_id: userId,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      unlocked_at: new Date(achievement.unlockedAt).toISOString()
    }));

    const { error } = await supabase
      .from('achievements')
      .upsert(achievementData);

    return !error;
  } catch (error) {
    console.error('Erro ao sincronizar conquistas:', error);
    return false;
  }
};

// Carregar conquistas da nuvem
export const loadAchievements = async (): Promise<Achievement[]> => {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    const userId = getUserId(user.email);
    
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error || !data) return [];

    return data.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type as any,
      unlockedAt: new Date(achievement.unlocked_at)
    }));
  } catch (error) {
    console.error('Erro ao carregar conquistas:', error);
    return [];
  }
};

// Sincronização completa
export const syncAllData = async (data: {
  profile: UserProfile;
  goal: Goal;
  progress: TrainingProgress[];
  achievements: Achievement[];
}): Promise<{ success: boolean; lastSync: Date }> => {
  try {
    const results = await Promise.all([
      syncUserProfile(data.profile),
      syncGoal(data.goal),
      syncTrainingProgress(data.progress),
      syncAchievements(data.achievements)
    ]);

    const success = results.every(result => result);
    const lastSync = new Date();
    
    if (success) {
      localStorage.setItem('running_trainer_last_sync', lastSync.toISOString());
    }

    return { success, lastSync };
  } catch (error) {
    console.error('Erro na sincronização completa:', error);
    return { success: false, lastSync: new Date() };
  }
};

// Carregar todos os dados da nuvem
export const loadAllData = async (): Promise<{
  profile: UserProfile | null;
  goal: Goal | null;
  progress: TrainingProgress[];
  achievements: Achievement[];
}> => {
  try {
    const [profile, goal, progress, achievements] = await Promise.all([
      loadUserProfile(),
      loadGoal(),
      loadTrainingProgress(),
      loadAchievements()
    ]);

    return { profile, goal, progress, achievements };
  } catch (error) {
    console.error('Erro ao carregar dados da nuvem:', error);
    return { profile: null, goal: null, progress: [], achievements: [] };
  }
};

// Verificar status de conectividade
export const checkConnectivity = (): boolean => {
  return navigator.onLine;
};

// Obter última sincronização
export const getLastSync = (): Date | null => {
  const lastSync = localStorage.getItem('running_trainer_last_sync');
  return lastSync ? new Date(lastSync) : null;
};