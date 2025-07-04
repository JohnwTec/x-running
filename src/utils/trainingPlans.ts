import { UserProfile, TrainingPlan } from '../types';
import { getAgeGroup } from './calculations';

export const getTrainingPlan = (
  profile: UserProfile, 
  type: 'longa' | 'intervalado' | 'warmup', 
  intervalDistance?: string
): TrainingPlan => {
  const ageGroup = getAgeGroup(profile.age);
  const level = profile.level;

  if (type === 'longa') {
    if (level === 'iniciante') return { distance: 4, pace: 8 };
    if (level === 'intermediário') return { distance: 7, pace: 7 };
    if (level === 'avançado') return { distance: 11, pace: 6 };
    return { distance: 16, pace: 5 };
  } 
  
  if (type === 'intervalado') {
    if (level === 'iniciante') {
      if (intervalDistance === '100m') return { intervals: 6, intensity: '90-95% FCmáx', rest: 'caminhada total' };
      if (intervalDistance === '400m') return { intervals: 4, intensity: '60-75% FCmáx', rest: 60 };
      if (intervalDistance === '600m') return { intervals: 4, intensity: '75-80% FCmáx', rest: 120 };
      return { intervals: 4, intensity: '75-80% FCmáx', rest: 120 };
    }
    
    if (level === 'intermediário') {
      if (intervalDistance === '100m') return { intervals: 8, intensity: 'máximo', rest: 'caminhada' };
      if (intervalDistance === '400m') return { intervals: 6, intensity: '80-85% FCmáx', rest: 60 };
      if (intervalDistance === '600m') return { intervals: 6, intensity: 'VO₂ máx', rest: '400m trote' };
      return { intervals: 6, intensity: '80-85% FCmáx', rest: 60 };
    }
    
    if (level === 'avançado') {
      if (intervalDistance === '100m') return { intervals: 6, intensity: 'neuromuscular', rest: 'walk-back' };
      if (intervalDistance === '400m') return { intervals: 8, intensity: '85-90% FCmáx', rest: 60 };
      if (intervalDistance === '600m') return { intervals: 6, intensity: 'VO₂ máx', rest: '400m trote' };
      return { intervals: 8, intensity: '85-90% FCmáx', rest: 60 };
    }
    
    return { intervals: 10, intensity: '90-95% FCmáx', rest: 45 };
  }
  
  if (type === 'warmup') {
    return { 
      exercises: [
        'Trote leve por 10 minutos',
        'Mobilidade dinâmica por 5 minutos',
        'Elevação de joelhos (30 segundos)',
        'Agachamentos leves (30 segundos)',
        'Alongamento dinâmico das pernas'
      ], 
      intensity: 'leve', 
      rest: 0 
    };
  }

  return { intervals: 0, intensity: '', rest: 0 };
};

export const getSuggestedGoal = (level: string, age: number): { distance: number; months: number } => {
  if (level === 'iniciante') return { distance: 10, months: 3 };
  if (level === 'intermediário') return { distance: 15, months: 3 };
  if (level === 'avançado') return { distance: 21, months: 3 };
  return { distance: 42, months: 6 };
};

export const getProgressionPlan = (goalDistance: number, months: number, currentLevel: string): number[] => {
  const weeks = months * 4;
  const baseDistance = currentLevel === 'iniciante' ? 4 : 
                      currentLevel === 'intermediário' ? 7 : 
                      currentLevel === 'avançado' ? 11 : 16;
  const increment = (goalDistance - baseDistance) / weeks * 1.1;
  return Array.from({ length: weeks }, (_, i) => 
    Math.round((baseDistance + i * increment) * 10) / 10
  );
};