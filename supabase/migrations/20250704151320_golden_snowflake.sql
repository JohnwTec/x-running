/*
  # Esquema completo do banco de dados para o app de corrida

  1. Novas Tabelas
    - `user_profiles` - Perfis dos usuários
    - `goals` - Metas dos usuários  
    - `training_progress` - Histórico de treinos
    - `achievements` - Conquistas desbloqueadas
    - `weekly_stats` - Estatísticas semanais
    - `device_connections` - Conexões com dispositivos
    - `social_shares` - Compartilhamentos sociais
    - `nutrition_logs` - Registros nutricionais
    - `health_metrics` - Métricas de saúde

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados acessarem apenas seus dados

  3. Funcionalidades
    - Triggers para atualização automática de timestamps
    - Índices para otimização de consultas
    - Constraints para integridade dos dados
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  weight numeric(5,2) NOT NULL CHECK (weight > 0),
  height numeric(3,2) NOT NULL CHECK (height > 0),
  level text NOT NULL CHECK (level IN ('iniciante', 'intermediário', 'avançado', 'profissional')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('suggested', 'manual')),
  distance numeric(6,2) NOT NULL CHECK (distance > 0),
  months integer NOT NULL CHECK (months > 0),
  target_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de progresso de treinos
CREATE TABLE IF NOT EXISTS training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL CHECK (type IN ('longa', 'intervalado', 'warmup')),
  distance numeric(6,3) NOT NULL CHECK (distance >= 0),
  duration integer NOT NULL CHECK (duration > 0), -- em segundos
  pace numeric(4,2) NOT NULL CHECK (pace > 0), -- min/km
  difficulty text CHECK (difficulty IN ('easy', 'normal', 'hard')),
  heart_rate_avg integer CHECK (heart_rate_avg > 0 AND heart_rate_avg < 250),
  heart_rate_max integer CHECK (heart_rate_max > 0 AND heart_rate_max < 250),
  calories_burned integer CHECK (calories_burned > 0),
  elevation_gain numeric(6,2) DEFAULT 0,
  weather_temp numeric(4,1),
  weather_condition text,
  gps_accuracy numeric(5,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL, -- ID único da conquista
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  type text NOT NULL CHECK (type IN ('distance', 'weekly', 'monthly', 'streak', 'pace', 'special')),
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Tabela de estatísticas semanais
CREATE TABLE IF NOT EXISTS weekly_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_distance numeric(8,3) DEFAULT 0,
  total_duration integer DEFAULT 0, -- em segundos
  total_trainings integer DEFAULT 0,
  avg_pace numeric(4,2),
  avg_heart_rate numeric(5,2),
  calories_burned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Tabela de conexões com dispositivos
CREATE TABLE IF NOT EXISTS device_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('apple_health', 'smartwatch', 'strava', 'amazfit', 'garmin', 'fitbit')),
  device_name text,
  device_id text,
  is_connected boolean DEFAULT true,
  last_sync timestamptz,
  sync_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_type)
);

-- Tabela de compartilhamentos sociais
CREATE TABLE IF NOT EXISTS social_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id uuid REFERENCES training_progress(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook', 'strava', 'twitter')),
  shared_at timestamptz DEFAULT now(),
  share_content text,
  engagement_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tabela de registros nutricionais
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),
  food_item text NOT NULL,
  calories numeric(6,2),
  carbs numeric(5,2),
  protein numeric(5,2),
  fat numeric(5,2),
  water_ml integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de métricas de saúde
CREATE TABLE IF NOT EXISTS health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric(5,2),
  body_fat_percentage numeric(4,2),
  muscle_mass numeric(5,2),
  resting_heart_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  sleep_hours numeric(3,1),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para goals
CREATE POLICY "Users can manage own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para training_progress
CREATE POLICY "Users can manage own training progress"
  ON training_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para achievements
CREATE POLICY "Users can manage own achievements"
  ON achievements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para weekly_stats
CREATE POLICY "Users can manage own weekly stats"
  ON weekly_stats
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para device_connections
CREATE POLICY "Users can manage own device connections"
  ON device_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para social_shares
CREATE POLICY "Users can manage own social shares"
  ON social_shares
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para nutrition_logs
CREATE POLICY "Users can manage own nutrition logs"
  ON nutrition_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para health_metrics
CREATE POLICY "Users can manage own health metrics"
  ON health_metrics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualização automática de updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_stats_updated_at
  BEFORE UPDATE ON weekly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_connections_updated_at
  BEFORE UPDATE ON device_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_training_progress_user_id ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_date ON training_progress(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_training_progress_type ON training_progress(user_id, type);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(user_id, type);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_id ON weekly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_week ON weekly_stats(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_device_connections_user_id ON device_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date DESC);

-- Função para calcular estatísticas semanais automaticamente
CREATE OR REPLACE FUNCTION calculate_weekly_stats(user_uuid uuid, week_start_date date)
RETURNS void AS $$
DECLARE
  week_end_date date := week_start_date + interval '6 days';
  stats_record record;
BEGIN
  -- Calcular estatísticas da semana
  SELECT 
    COALESCE(SUM(distance), 0) as total_distance,
    COALESCE(SUM(duration), 0) as total_duration,
    COUNT(*) as total_trainings,
    COALESCE(AVG(pace), 0) as avg_pace,
    COALESCE(AVG(heart_rate_avg), 0) as avg_heart_rate,
    COALESCE(SUM(calories_burned), 0) as calories_burned
  INTO stats_record
  FROM training_progress
  WHERE user_id = user_uuid
    AND date::date >= week_start_date
    AND date::date <= week_end_date;

  -- Inserir ou atualizar estatísticas semanais
  INSERT INTO weekly_stats (
    user_id, week_start, week_end, total_distance, total_duration,
    total_trainings, avg_pace, avg_heart_rate, calories_burned
  )
  VALUES (
    user_uuid, week_start_date, week_end_date, stats_record.total_distance,
    stats_record.total_duration, stats_record.total_trainings, stats_record.avg_pace,
    stats_record.avg_heart_rate, stats_record.calories_burned
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    week_end = EXCLUDED.week_end,
    total_distance = EXCLUDED.total_distance,
    total_duration = EXCLUDED.total_duration,
    total_trainings = EXCLUDED.total_trainings,
    avg_pace = EXCLUDED.avg_pace,
    avg_heart_rate = EXCLUDED.avg_heart_rate,
    calories_burned = EXCLUDED.calories_burned,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular estatísticas semanais automaticamente
CREATE OR REPLACE FUNCTION trigger_calculate_weekly_stats()
RETURNS TRIGGER AS $$
DECLARE
  week_start_date date;
BEGIN
  -- Calcular início da semana (segunda-feira)
  week_start_date := date_trunc('week', NEW.date::date);
  
  -- Calcular estatísticas para a semana do treino
  PERFORM calculate_weekly_stats(NEW.user_id, week_start_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_progress_weekly_stats_trigger
  AFTER INSERT OR UPDATE ON training_progress
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_weekly_stats();

-- Função para verificar conquistas automaticamente
CREATE OR REPLACE FUNCTION check_achievements_trigger()
RETURNS TRIGGER AS $$
DECLARE
  total_distance numeric;
  total_trainings integer;
  best_pace numeric;
  current_week_distance numeric;
BEGIN
  -- Calcular estatísticas totais do usuário
  SELECT 
    COALESCE(SUM(distance), 0),
    COUNT(*),
    COALESCE(MIN(pace), 999)
  INTO total_distance, total_trainings, best_pace
  FROM training_progress
  WHERE user_id = NEW.user_id;

  -- Calcular distância da semana atual
  SELECT COALESCE(SUM(distance), 0)
  INTO current_week_distance
  FROM training_progress
  WHERE user_id = NEW.user_id
    AND date >= date_trunc('week', NEW.date);

  -- Verificar conquistas de distância total
  IF total_distance >= 10 AND NOT EXISTS (
    SELECT 1 FROM achievements WHERE user_id = NEW.user_id AND achievement_id = 'total_10km'
  ) THEN
    INSERT INTO achievements (user_id, achievement_id, name, description, icon, type)
    VALUES (NEW.user_id, 'total_10km', 'Primeiros 10km', 'Completou 10km totais', '🏃', 'distance');
  END IF;

  IF total_distance >= 50 AND NOT EXISTS (
    SELECT 1 FROM achievements WHERE user_id = NEW.user_id AND achievement_id = 'total_50km'
  ) THEN
    INSERT INTO achievements (user_id, achievement_id, name, description, icon, type)
    VALUES (NEW.user_id, 'total_50km', 'Meio Centenário', 'Completou 50km totais', '🎯', 'distance');
  END IF;

  IF total_distance >= 100 AND NOT EXISTS (
    SELECT 1 FROM achievements WHERE user_id = NEW.user_id AND achievement_id = 'total_100km'
  ) THEN
    INSERT INTO achievements (user_id, achievement_id, name, description, icon, type)
    VALUES (NEW.user_id, 'total_100km', 'Centenário', 'Completou 100km totais', '💯', 'distance');
  END IF;

  -- Verificar conquistas semanais
  IF current_week_distance >= 10 AND NOT EXISTS (
    SELECT 1 FROM achievements WHERE user_id = NEW.user_id AND achievement_id = 'weekly_10km'
  ) THEN
    INSERT INTO achievements (user_id, achievement_id, name, description, icon, type)
    VALUES (NEW.user_id, 'weekly_10km', 'Semana Ativa', 'Correu 10km em uma semana', '📅', 'weekly');
  END IF;

  -- Verificar conquistas de pace
  IF best_pace <= 6 AND NOT EXISTS (
    SELECT 1 FROM achievements WHERE user_id = NEW.user_id AND achievement_id = 'pace_6min'
  ) THEN
    INSERT INTO achievements (user_id, achievement_id, name, description, icon, type)
    VALUES (NEW.user_id, 'pace_6min', 'Corredor Rápido', 'Pace abaixo de 6 min/km', '💨', 'pace');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_training
  AFTER INSERT ON training_progress
  FOR EACH ROW EXECUTE FUNCTION check_achievements_trigger();

-- Views para relatórios e análises
CREATE OR REPLACE VIEW user_training_summary AS
SELECT 
  tp.user_id,
  up.name,
  COUNT(*) as total_trainings,
  SUM(tp.distance) as total_distance,
  SUM(tp.duration) as total_duration,
  AVG(tp.pace) as avg_pace,
  AVG(tp.heart_rate_avg) as avg_heart_rate,
  MIN(tp.pace) as best_pace,
  MAX(tp.distance) as longest_run,
  DATE_TRUNC('month', tp.date) as month
FROM training_progress tp
JOIN user_profiles up ON tp.user_id = up.user_id
GROUP BY tp.user_id, up.name, DATE_TRUNC('month', tp.date);

CREATE OR REPLACE VIEW monthly_progress AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  COUNT(*) as trainings_count,
  SUM(distance) as total_distance,
  AVG(pace) as avg_pace,
  SUM(duration) as total_duration,
  AVG(heart_rate_avg) as avg_heart_rate
FROM training_progress
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY user_id, month DESC;