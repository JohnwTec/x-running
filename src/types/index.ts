export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  level: 'iniciante' | 'intermediário' | 'avançado' | 'profissional' | null;
}

export interface Goal {
  type: 'suggested' | 'manual';
  distance: number;
  months: number;
}

export interface TrainingProgress {
  id: string;
  date: Date;
  pace: number;
  distance: number;
  type: 'longa' | 'intervalado';
  duration: number;
  difficulty?: 'easy' | 'normal' | 'hard';
}

export interface TrainingPlan {
  distance?: number;
  pace?: number;
  intervals?: number;
  intensity?: string;
  rest?: number | string;
  exercises?: string[];
}

export interface WeeklyTrainings {
  longa: number;
  intervalado: number;
  weekStart: Date;
}

export interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  type: 'distance' | 'weekly' | 'monthly' | 'streak' | 'pace';
}

export interface WeeklyStats {
  week: number;
  totalDistance: number;
  totalTime: number;
  trainingsCount: number;
  averagePace: number;
}

export interface AdaptiveSettings {
  currentPace: number;
  currentRestTime: number;
  difficultyLevel: number; // 1-10
  lastAdjustment: Date;
}