import { supabase } from './supabase';
import { UserProfile, Goal, TrainingProgress, Achievement } from '../types';

// Tipos específicos do banco de dados
export interface DatabaseTrainingProgress {
  id: string;
  user_id: string;
  date: string;
  type: 'longa' | 'intervalado' | 'warmup';
  distance: number;
  duration: number;
  pace: number;
  difficulty?: 'easy' | 'normal' | 'hard';
  heart_rate_avg?: number;
  heart_rate_max?: number;
  calories_burned?: number;
  elevation_gain?: number;
  weather_temp?: number;
  weather_condition?: string;
  gps_accuracy?: number;
  notes?: string;
  created_at: string;
}

export interface DatabaseWeeklyStats {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_distance: number;
  total_duration: number;
  total_trainings: number;
  avg_pace: number;
  avg_heart_rate: number;
  calories_burned: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseHealthMetrics {
  id: string;
  user_id: string;
  date: string;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  resting_heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  sleep_hours?: number;
  sleep_quality?: number;
  stress_level?: number;
  energy_level?: number;
  notes?: string;
  created_at: string;
}

export interface DatabaseNutritionLog {
  id: string;
  user_id: string;
  date: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  food_item: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  water_ml?: number;
  notes?: string;
  created_at: string;
}

class DatabaseService {
  // Operações de perfil de usuário
  async createUserProfile(profile: UserProfile & { email: string }): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: profile.email,
          name: profile.name,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          level: profile.level
        });

      return !error;
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      return false;
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;

      return {
        name: data.name,
        age: data.age,
        weight: data.weight,
        height: data.height,
        level: data.level
      };
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }

  async updateUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profile.name,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          level: profile.level
        })
        .eq('user_id', user.id);

      return !error;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }

  // Operações de metas
  async createGoal(goal: Goal): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Desativar metas anteriores
      await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + goal.months);

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          type: goal.type,
          distance: goal.distance,
          months: goal.months,
          target_date: targetDate.toISOString().split('T')[0],
          is_active: true
        });

      return !error;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return false;
    }
  }

  async getActiveGoal(): Promise<Goal | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        type: data.type,
        distance: data.distance,
        months: data.months
      };
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
      return null;
    }
  }

  // Operações de progresso de treino
  async saveTrainingProgress(training: Omit<TrainingProgress, 'id'> & {
    heartRateAvg?: number;
    heartRateMax?: number;
    caloriesBurned?: number;
    elevationGain?: number;
    weatherTemp?: number;
    weatherCondition?: string;
    gpsAccuracy?: number;
    notes?: string;
  }): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('training_progress')
        .insert({
          user_id: user.id,
          date: training.date.toISOString(),
          type: training.type,
          distance: training.distance,
          duration: training.duration,
          pace: training.pace,
          difficulty: training.difficulty,
          heart_rate_avg: training.heartRateAvg,
          heart_rate_max: training.heartRateMax,
          calories_burned: training.caloriesBurned,
          elevation_gain: training.elevationGain,
          weather_temp: training.weatherTemp,
          weather_condition: training.weatherCondition,
          gps_accuracy: training.gpsAccuracy,
          notes: training.notes
        })
        .select('id')
        .single();

      return data?.id || null;
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      return null;
    }
  }

  async getTrainingProgress(limit?: number): Promise<TrainingProgress[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error || !data) return [];

      return data.map(training => ({
        id: training.id,
        date: new Date(training.date),
        type: training.type,
        distance: training.distance,
        duration: training.duration,
        pace: training.pace,
        difficulty: training.difficulty
      }));
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      return [];
    }
  }

  // Operações de conquistas
  async getAchievements(): Promise<Achievement[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error || !data) return [];

      return data.map(achievement => ({
        id: achievement.achievement_id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        unlockedAt: new Date(achievement.unlocked_at)
      }));
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      return [];
    }
  }

  // Operações de estatísticas semanais
  async getWeeklyStats(weeks?: number): Promise<DatabaseWeeklyStats[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false });

      if (weeks) {
        query = query.limit(weeks);
      }

      const { data, error } = await query;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas semanais:', error);
      return [];
    }
  }

  // Operações de métricas de saúde
  async saveHealthMetrics(metrics: Omit<DatabaseHealthMetrics, 'id' | 'user_id' | 'created_at'>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('health_metrics')
        .upsert({
          user_id: user.id,
          ...metrics
        });

      return !error;
    } catch (error) {
      console.error('Erro ao salvar métricas de saúde:', error);
      return false;
    }
  }

  async getHealthMetrics(days?: number): Promise<DatabaseHealthMetrics[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (days) {
        query = query.limit(days);
      }

      const { data, error } = await query;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar métricas de saúde:', error);
      return [];
    }
  }

  // Operações de nutrição
  async saveNutritionLog(nutrition: Omit<DatabaseNutritionLog, 'id' | 'user_id' | 'created_at'>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: user.id,
          ...nutrition
        });

      return !error;
    } catch (error) {
      console.error('Erro ao salvar log nutricional:', error);
      return false;
    }
  }

  async getNutritionLogs(date: string): Promise<DatabaseNutritionLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs nutricionais:', error);
      return [];
    }
  }

  // Operações de conexões de dispositivos
  async saveDeviceConnection(deviceType: string, deviceName?: string, deviceId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('device_connections')
        .upsert({
          user_id: user.id,
          device_type: deviceType,
          device_name: deviceName,
          device_id: deviceId,
          is_connected: true,
          last_sync: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Erro ao salvar conexão de dispositivo:', error);
      return false;
    }
  }

  async getDeviceConnections(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('device_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_connected', true);

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar conexões de dispositivos:', error);
      return [];
    }
  }

  // Operações de compartilhamento social
  async saveSocialShare(trainingId: string, platform: string, content: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('social_shares')
        .insert({
          user_id: user.id,
          training_id: trainingId,
          platform,
          share_content: content
        });

      return !error;
    } catch (error) {
      console.error('Erro ao salvar compartilhamento social:', error);
      return false;
    }
  }

  // Relatórios e análises
  async getTrainingSummary(period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .rpc('get_training_summary', {
          user_uuid: user.id,
          period_type: period
        });

      return data;
    } catch (error) {
      console.error('Erro ao buscar resumo de treinos:', error);
      return null;
    }
  }

  async getProgressComparison(weeks: number = 4): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(weeks);

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar comparação de progresso:', error);
      return [];
    }
  }

  // Função para sincronizar dados offline
  async syncOfflineData(offlineData: any): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Implementar lógica de sincronização de dados offline
      // Isso incluiria verificar timestamps e resolver conflitos

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar dados offline:', error);
      return false;
    }
  }
}

export const database = new DatabaseService();