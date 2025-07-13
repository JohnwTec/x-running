import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Heart, Bluetooth, Settings, Share2, ArrowLeft, Save, RotateCcw, AlertTriangle, Navigation } from 'lucide-react';
import { UserProfile, Position, AdaptiveSettings } from '../types';
import { getTrainingPlan } from '../utils/trainingPlans';
import { formatTime } from '../utils/calculations';
import { shouldSuggestProgression, getProgressionSuggestion } from '../utils/adaptiveTraining';
import { WarmupSession } from './WarmupSession';
import { AdaptiveTrainingModal } from './AdaptiveTrainingModal';
import { FitnessConnectionModal } from './FitnessConnectionModal';
import { SocialShareModal } from './SocialShareModal';
import { AICoachWidget } from './AICoachWidget';
import { GPSTracker, GPSState } from '../utils/gpsTracking';
import { fitnessIntegration } from '../utils/fitnessIntegration';
import { aiCoach } from '../utils/aiCoach';
import { GPSStatusIndicator } from './GPSStatusIndicator';
import { GPSDebugPanel } from './GPSDebugPanel';

interface TrainingSessionProps {
  userProfile: UserProfile;
  trainingType: 'warmup' | 'longa' | 'intervalado';
  intervalDistance?: string;
  trainingProgress: any[];
  onTrainingComplete: (data: { distance: number; time: number; pace: number; difficulty?: 'easy' | 'normal' | 'hard' }) => void;
  onBack?: () => void;
}

export const TrainingSession: React.FC<TrainingSessionProps> = ({
  userProfile,
  trainingType,
  intervalDistance,
  trainingProgress,
  onTrainingComplete,
  onBack
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gpsState, setGpsState] = useState<GPSState>({
    isTracking: false,
    accuracy: 0,
    speed: null,
    heading: null,
    altitude: null,
    lastUpdate: null
  });
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [intervalCount, setIntervalCount] = useState(0);
  const [showWarmup, setShowWarmup] = useState(trainingType === 'warmup');
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);
  const [showFitnessModal, setShowFitnessModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [adaptiveSuggestion, setAdaptiveSuggestion] = useState<any>(null);
  const [aiCoachFeedback, setAiCoachFeedback] = useState<string>('');
  const [currentPace, setCurrentPace] = useState(0);
  const [currentRestTime, setCurrentRestTime] = useState(0);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [completedTrainingData, setCompletedTrainingData] = useState<any>(null);
  const [savedTrainingData, setSavedTrainingData] = useState<any>(null);
  const [showGPSDebug, setShowGPSDebug] = useState(false);
  const [gpsTracker] = useState(() => new GPSTracker({
    onPositionUpdate: (position, state) => {
      setGpsState(state);
      setDistance(gpsTracker.getDistance());
    },
    onError: (error) => {
      console.error('Erro de GPS:', error);
      // Mostrar notificação de erro para o usuário
      alert(`Erro de GPS: ${error.message}. Verifique se o GPS está ativado e tente novamente.`);
    },
    onStateChange: (state) => {
      setGpsState(state);
    }
  }));

  const plan = getTrainingPlan(userProfile, trainingType, intervalDistance);
  const pace = timer > 0 && distance > 0 ? (timer / 60) / distance : 0;

  // IA Coach feedback em tempo real
  useEffect(() => {
    if (isRunning && timer > 60) { // Após 1 minuto de treino
      generateAIFeedback();
    }
  }, [timer, distance, pace]);

  const generateAIFeedback = async () => {
    if (timer % 300 !== 0) return; // A cada 5 minutos
    
    try {
      const context = {
        userProfile,
        recentTrainings: trainingProgress,
        weeklyStats: [],
        currentGoal: { distance: plan.distance || 5, months: 3, type: 'suggested' as const }
      };
      
      // Simular feedback baseado no pace atual vs esperado
      const expectedPace = plan.pace || 7;
      const paceRatio = pace / expectedPace;
      
      let feedback = '';
      if (paceRatio < 0.9) {
        feedback = '🔥 Você está indo muito bem! Pace excelente, mas cuidado para não se esgotar muito cedo.';
      } else if (paceRatio < 1.1) {
        feedback = '👍 Pace perfeito! Continue assim, você está no ritmo ideal para seu objetivo.';
      } else {
        feedback = '💪 Sem pressa! Lembre-se que consistência é mais importante que velocidade.';
      }
      
      setAiCoachFeedback(feedback);
      
      // Limpar feedback após 10 segundos
      setTimeout(() => setAiCoachFeedback(''), 10000);
    } catch (error) {
      console.error('Erro ao gerar feedback da IA:', error);
    }
  };

  // Rest of the component code...

  return (
    <>
      {/* Component JSX */}
      
      {/* AI Coach Widget durante treino */}
      {isRunning && (
        <AICoachWidget
          userProfile={userProfile}
          recentTrainings={trainingProgress}
          onOpenFullCoach={() => {}} // Desabilitado durante treino
        />
      )}
    </>
  );
};