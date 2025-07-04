import { TrainingProgress, UserProfile, AdaptiveSettings } from '../types';

export const shouldSuggestProgression = (
  recentTrainings: TrainingProgress[],
  currentPace: number,
  trainingType: 'longa' | 'intervalado'
): boolean => {
  if (recentTrainings.length < 2) return false;

  const lastTwoTrainings = recentTrainings
    .filter(t => t.type === trainingType)
    .slice(-2);

  if (lastTwoTrainings.length < 2) return false;

  // Se os últimos 2 treinos foram mais rápidos que o pace sugerido
  const averageActualPace = lastTwoTrainings.reduce((sum, t) => sum + t.pace, 0) / lastTwoTrainings.length;
  
  // Considera "fácil" se o pace real foi 10% mais rápido que o sugerido
  return averageActualPace < currentPace * 0.9;
};

export const getProgressionSuggestion = (
  currentPace: number,
  currentRestTime: number,
  trainingType: 'longa' | 'intervalado',
  userLevel: string
): { newPace?: number; newRestTime?: number; message: string } => {
  if (trainingType === 'longa') {
    // Para corrida longa, diminui o pace em 10-30 segundos
    const reduction = userLevel === 'iniciante' ? 30 : userLevel === 'intermediário' ? 20 : 10;
    const newPace = Math.max(currentPace - (reduction / 60), 4); // Não vai abaixo de 4 min/km
    
    return {
      newPace,
      message: `Você está indo muito bem! Que tal tentar um pace de ${newPace.toFixed(1)} min/km hoje?`
    };
  } else {
    // Para intervalado, diminui o tempo de descanso em 15s e o pace em 10s
    const paceReduction = 10 / 60; // 10 segundos
    const restReduction = 15; // 15 segundos
    
    const newPace = Math.max(currentPace - paceReduction, 3.5);
    const newRestTime = Math.max(currentRestTime - restReduction, 30);
    
    return {
      newPace,
      newRestTime,
      message: `Excelente progresso! Vamos intensificar: pace ${newPace.toFixed(1)} min/km e descanso de ${newRestTime}s?`
    };
  }
};

export const evaluateTrainingDifficulty = (
  actualPace: number,
  suggestedPace: number,
  userFeedback?: 'easy' | 'normal' | 'hard'
): 'easy' | 'normal' | 'hard' => {
  if (userFeedback) return userFeedback;
  
  const paceRatio = actualPace / suggestedPace;
  
  if (paceRatio <= 0.9) return 'easy';
  if (paceRatio >= 1.1) return 'hard';
  return 'normal';
};

export const getAdaptiveRecommendation = (
  userProfile: UserProfile,
  recentTrainings: TrainingProgress[],
  currentSettings: AdaptiveSettings
): { shouldAdjust: boolean; suggestion?: any } => {
  const lastTraining = recentTrainings[recentTrainings.length - 1];
  if (!lastTraining) return { shouldAdjust: false };

  const difficulty = evaluateTrainingDifficulty(lastTraining.pace, currentSettings.currentPace);
  
  // Só sugere ajuste se o último treino foi fácil e já passou pelo menos 1 dia
  const daysSinceLastAdjustment = Math.floor(
    (new Date().getTime() - new Date(currentSettings.lastAdjustment).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (difficulty === 'easy' && daysSinceLastAdjustment >= 1) {
    const suggestion = getProgressionSuggestion(
      currentSettings.currentPace,
      currentSettings.currentRestTime,
      lastTraining.type,
      userProfile.level!
    );

    return {
      shouldAdjust: true,
      suggestion
    };
  }

  return { shouldAdjust: false };
};