import { TrainingProgress, Achievement, WeeklyStats } from '../types';

export const checkAchievements = (
  trainingProgress: TrainingProgress[],
  weeklyStats: WeeklyStats[],
  currentAchievements: Achievement[]
): Achievement[] => {
  const newAchievements: Achievement[] = [];
  const existingIds = currentAchievements.map(a => a.id);

  const totalDistance = trainingProgress.reduce((sum, t) => sum + t.distance, 0);
  const thisWeek = weeklyStats[weeklyStats.length - 1];
  const thisMonth = weeklyStats.slice(-4);

  // Conquistas de distância total
  const distanceAchievements = [
    { km: 10, name: 'Primeiros 10km', description: 'Completou 10km totais', icon: '🏃' },
    { km: 50, name: 'Meio Centenário', description: 'Completou 50km totais', icon: '🎯' },
    { km: 100, name: 'Centenário', description: 'Completou 100km totais', icon: '💯' },
    { km: 250, name: 'Maratonista', description: 'Completou 250km totais', icon: '🏆' },
    { km: 500, name: 'Ultra Runner', description: 'Completou 500km totais', icon: '⚡' },
    { km: 1000, name: 'Lenda da Corrida', description: 'Completou 1000km totais', icon: '👑' }
  ];

  distanceAchievements.forEach(({ km, name, description, icon }) => {
    const id = `total_${km}km`;
    if (totalDistance >= km && !existingIds.includes(id)) {
      newAchievements.push({
        id,
        name,
        description,
        icon,
        unlockedAt: new Date(),
        type: 'distance'
      });
    }
  });

  // Conquistas semanais
  if (thisWeek) {
    const weeklyAchievements = [
      { km: 10, name: 'Semana Ativa', description: 'Correu 10km em uma semana', icon: '📅' },
      { km: 20, name: 'Semana Forte', description: 'Correu 20km em uma semana', icon: '💪' },
      { km: 30, name: 'Semana Épica', description: 'Correu 30km em uma semana', icon: '🔥' },
      { km: 50, name: 'Semana Lendária', description: 'Correu 50km em uma semana', icon: '🌟' }
    ];

    weeklyAchievements.forEach(({ km, name, description, icon }) => {
      const id = `weekly_${km}km`;
      if (thisWeek.totalDistance >= km && !existingIds.includes(id)) {
        newAchievements.push({
          id,
          name,
          description,
          icon,
          unlockedAt: new Date(),
          type: 'weekly'
        });
      }
    });
  }

  // Conquistas mensais
  if (thisMonth.length >= 4) {
    const monthlyDistance = thisMonth.reduce((sum, week) => sum + week.totalDistance, 0);
    const monthlyAchievements = [
      { km: 50, name: 'Mês Consistente', description: 'Correu 50km em um mês', icon: '🗓️' },
      { km: 100, name: 'Mês Dedicado', description: 'Correu 100km em um mês', icon: '🎖️' },
      { km: 150, name: 'Mês Excepcional', description: 'Correu 150km em um mês', icon: '🏅' }
    ];

    monthlyAchievements.forEach(({ km, name, description, icon }) => {
      const id = `monthly_${km}km`;
      if (monthlyDistance >= km && !existingIds.includes(id)) {
        newAchievements.push({
          id,
          name,
          description,
          icon,
          unlockedAt: new Date(),
          type: 'monthly'
        });
      }
    });
  }

  // Conquistas de sequência
  const recentTrainings = trainingProgress.slice(-7);
  const consecutiveDays = getConsecutiveDays(recentTrainings);
  
  const streakAchievements = [
    { days: 3, name: 'Sequência Iniciante', description: '3 dias consecutivos', icon: '🔥' },
    { days: 5, name: 'Sequência Dedicada', description: '5 dias consecutivos', icon: '⚡' },
    { days: 7, name: 'Semana Perfeita', description: '7 dias consecutivos', icon: '👑' }
  ];

  streakAchievements.forEach(({ days, name, description, icon }) => {
    const id = `streak_${days}days`;
    if (consecutiveDays >= days && !existingIds.includes(id)) {
      newAchievements.push({
        id,
        name,
        description,
        icon,
        unlockedAt: new Date(),
        type: 'streak'
      });
    }
  });

  // Conquistas de pace
  const bestPace = Math.min(...trainingProgress.map(t => t.pace));
  const paceAchievements = [
    { pace: 7, name: 'Velocista', description: 'Pace abaixo de 7 min/km', icon: '🚀' },
    { pace: 6, name: 'Corredor Rápido', description: 'Pace abaixo de 6 min/km', icon: '💨' },
    { pace: 5, name: 'Elite Runner', description: 'Pace abaixo de 5 min/km', icon: '⭐' }
  ];

  paceAchievements.forEach(({ pace, name, description, icon }) => {
    const id = `pace_${pace}min`;
    if (bestPace <= pace && !existingIds.includes(id)) {
      newAchievements.push({
        id,
        name,
        description,
        icon,
        unlockedAt: new Date(),
        type: 'pace'
      });
    }
  });

  return newAchievements;
};

const getConsecutiveDays = (trainings: TrainingProgress[]): number => {
  if (trainings.length === 0) return 0;
  
  const sortedDates = trainings
    .map(t => new Date(t.date).toDateString())
    .sort()
    .reverse();
  
  let consecutive = 1;
  let maxConsecutive = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    const previous = new Date(sortedDates[i - 1]);
    const diffDays = Math.abs(current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 1;
    }
  }
  
  return maxConsecutive;
};