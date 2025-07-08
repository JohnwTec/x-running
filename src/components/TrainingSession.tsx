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
import { GPSTracker, GPSState } from '../utils/gpsTracking';
import { fitnessIntegration } from '../utils/fitnessIntegration';
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

  // Rest of the component code...

  return (
    <>
      {/* Component JSX */}
    </>
  );
};