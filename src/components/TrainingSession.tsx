import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, MapPin, Heart, Bluetooth, Settings, Share2 } from 'lucide-react';
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

interface TrainingSessionProps {
  userProfile: UserProfile;
  trainingType: 'warmup' | 'longa' | 'intervalado';
  intervalDistance?: string;
  trainingProgress: any[];
  onTrainingComplete: (data: { distance: number; time: number; pace: number; difficulty?: 'easy' | 'normal' | 'hard' }) => void;
}

export const TrainingSession: React.FC<TrainingSessionProps> = ({
  userProfile,
  trainingType,
  intervalDistance,
  trainingProgress,
  onTrainingComplete
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
  const [adaptiveSuggestion, setAdaptiveSuggestion] = useState<any>(null);
  const [currentPace, setCurrentPace] = useState(0);
  const [currentRestTime, setCurrentRestTime] = useState(0);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [completedTrainingData, setCompletedTrainingData] = useState<any>(null);
  const [gpsTracker] = useState(() => new GPSTracker({
    onPositionUpdate: (position, state) => {
      setGpsState(state);
      setDistance(gpsTracker.getDistance());
    },
    onError: (error) => {
      console.error('Erro de GPS:', error);
    },
    onStateChange: (state) => {
      setGpsState(state);
    }
  }));

  const plan = getTrainingPlan(userProfile, trainingType, intervalDistance);
  const pace = timer > 0 && distance > 0 ? (timer / 60) / distance : 0;

  // Inicializar configurações adaptativas
  useEffect(() => {
    if (plan.pace) setCurrentPace(plan.pace);
    if (typeof plan.rest === 'number') setCurrentRestTime(plan.rest);
  }, [plan]);

  // Configurar GPS e permissões
  useEffect(() => {
    const initializeGPS = async () => {
      const hasPermission = await gpsTracker.requestPermission();
      if (!hasPermission) {
        console.warn('Permissão de GPS negada');
      }
    };

    initializeGPS();

    // Listener para frequência cardíaca
    const handleHeartRateUpdate = (event: CustomEvent) => {
      setHeartRate(event.detail.heartRate);
    };

    window.addEventListener('heartRateUpdate', handleHeartRateUpdate as EventListener);

    return () => {
      gpsTracker.stopTracking();
      window.removeEventListener('heartRateUpdate', handleHeartRateUpdate as EventListener);
    };
  }, [gpsTracker]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Verificar se deve sugerir progressão
  useEffect(() => {
    if (trainingType !== 'warmup' && !showWarmup && !isRunning) {
      const recentTrainings = trainingProgress.slice(-5);
      const shouldSuggest = shouldSuggestProgression(recentTrainings, currentPace, trainingType);
      
      if (shouldSuggest) {
        const suggestion = getProgressionSuggestion(
          currentPace,
          currentRestTime,
          trainingType,
          userProfile.level!
        );
        setAdaptiveSuggestion(suggestion);
        setShowAdaptiveModal(true);
      }
    }
  }, [trainingType, showWarmup, isRunning, trainingProgress, currentPace, currentRestTime, userProfile.level]);

  const handleStart = () => {
    setIsRunning(true);
    gpsTracker.startTracking();
  };

  const handlePause = () => {
    setIsRunning(false);
    gpsTracker.stopTracking();
  };

  const handleStop = async () => {
    setIsRunning(false);
    gpsTracker.stopTracking();
    
    // Avaliar dificuldade baseada no pace real vs sugerido
    let difficulty: 'easy' | 'normal' | 'hard' = 'normal';
    if (currentPace > 0) {
      const paceRatio = pace / currentPace;
      if (paceRatio <= 0.9) difficulty = 'easy';
      else if (paceRatio >= 1.1) difficulty = 'hard';
    }

    const trainingData = { 
      distance, 
      time: timer, 
      pace, 
      difficulty,
      type: trainingType,
      date: new Date()
    };

    // Tentar enviar para Strava se conectado
    const connections = fitnessIntegration.getConnectionStatus();
    if (connections.strava && distance > 0) {
      try {
        await fitnessIntegration.uploadToStrava({
          type: trainingType,
          startTime: new Date(Date.now() - timer * 1000),
          endTime: new Date(),
          distance,
          duration: timer,
          heartRate: heartRate ? {
            average: heartRate,
            max: heartRate + 10,
            min: heartRate - 10
          } : undefined
        });
      } catch (error) {
        console.error('Erro ao enviar para Strava:', error);
      }
    }

    // Verificar se deve mostrar modal de compartilhamento social
    if (connections.instagram || connections.facebook) {
      setCompletedTrainingData(trainingData);
      setTrainingCompleted(true);
      setShowSocialModal(true);
    } else {
      onTrainingComplete(trainingData);
    }
  };

  const handleWarmupComplete = () => {
    setShowWarmup(false);
    if (trainingType === 'warmup') {
      onTrainingComplete({ distance: 0, time: 0, pace: 0 });
    }
  };

  const handleAcceptProgression = () => {
    if (adaptiveSuggestion.newPace) {
      setCurrentPace(adaptiveSuggestion.newPace);
    }
    if (adaptiveSuggestion.newRestTime) {
      setCurrentRestTime(adaptiveSuggestion.newRestTime);
    }
    setShowAdaptiveModal(false);
  };

  const handleRejectProgression = () => {
    setShowAdaptiveModal(false);
  };

  const handleSocialShareClose = () => {
    setShowSocialModal(false);
    if (trainingCompleted && completedTrainingData) {
      onTrainingComplete(completedTrainingData);
    }
  };

  // Se está mostrando aquecimento
  if (showWarmup) {
    return <WarmupSession onComplete={handleWarmupComplete} />;
  }

  // Se era só aquecimento e já foi completado, não mostra mais nada
  if (trainingType === 'warmup') {
    return null;
  }

  const getGPSStatusColor = () => {
    if (!gpsState.isTracking) return 'text-gray-500';
    if (gpsState.accuracy > 20) return 'text-red-500';
    if (gpsState.accuracy > 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getGPSStatusText = () => {
    if (!gpsState.isTracking) return 'GPS desconectado';
    if (gpsState.accuracy > 20) return `GPS impreciso (${gpsState.accuracy.toFixed(0)}m)`;
    if (gpsState.accuracy > 10) return `GPS moderado (${gpsState.accuracy.toFixed(0)}m)`;
    return `GPS preciso (${gpsState.accuracy.toFixed(0)}m)`;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {trainingType === 'longa' ? 'Corrida Longa' : 'Treino Intervalado'}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowFitnessModal(true)}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => setShowSocialModal(true)}
                  className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <Share2 className="w-5 h-5 text-green-600" />
                </button>
              </div>
            </div>
            {trainingType === 'intervalado' && intervalDistance && (
              <p className="text-gray-600">Distância: {intervalDistance}</p>
            )}
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* GPS Status */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <MapPin className={`w-4 h-4 mr-1 ${getGPSStatusColor()}`} />
                <span className="text-xs font-medium text-gray-600">GPS</span>
              </div>
              <p className={`text-xs text-center ${getGPSStatusColor()}`}>
                {getGPSStatusText()}
              </p>
            </div>

            {/* Heart Rate */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Heart className={`w-4 h-4 mr-1 ${heartRate ? 'text-red-500' : 'text-gray-400'}`} />
                <span className="text-xs font-medium text-gray-600">FC</span>
              </div>
              <p className={`text-xs text-center ${heartRate ? 'text-red-600' : 'text-gray-400'}`}>
                {heartRate ? `${heartRate} bpm` : 'Não conectado'}
              </p>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">{distance.toFixed(2)}</p>
              <p className="text-sm text-gray-600">km</p>
              {gpsState.speed && (
                <p className="text-xs text-blue-600 mt-1">
                  {(gpsState.speed * 3.6).toFixed(1)} km/h
                </p>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">{formatTime(timer)}</p>
              <p className="text-sm text-gray-600">tempo</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">{pace.toFixed(1)}</p>
              <p className="text-sm text-gray-600">min/km</p>
            </div>
            {trainingType === 'intervalado' && (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-800">{intervalCount}</p>
                <p className="text-sm text-gray-600">intervalos</p>
              </div>
            )}
          </div>

          {/* Training Plan Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-800 mb-2">Plano do Treino</h3>
            {trainingType === 'longa' && (
              <div className="text-sm text-blue-700">
                <p>Distância: {plan.distance} km</p>
                <p>Pace alvo: {currentPace.toFixed(1)} min/km</p>
              </div>
            )}
            {trainingType === 'intervalado' && (
              <div className="text-sm text-blue-700">
                <p>Intervalos: {plan.intervals}</p>
                <p>Intensidade: {plan.intensity}</p>
                <p>Descanso: {currentRestTime}s</p>
              </div>
            )}
          </div>

          {/* Pace Feedback */}
          {isRunning && pace > 0 && (
            <div className="mb-6">
              {pace < currentPace * 0.9 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm font-medium">🚀 Excelente! Você está mais rápido que o esperado!</p>
                </div>
              )}
              {pace > currentPace * 1.1 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm font-medium">⚡ Tente acelerar um pouco o ritmo!</p>
                </div>
              )}
              {pace >= currentPace * 0.9 && pace <= currentPace * 1.1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm font-medium">✅ Perfeito! Mantenha esse ritmo!</p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex space-x-4">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Iniciar</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Pause className="w-5 h-5" />
                <span>Pausar</span>
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Square className="w-5 h-5" />
              <span>Finalizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AdaptiveTrainingModal
        isOpen={showAdaptiveModal}
        onClose={handleRejectProgression}
        onAccept={handleAcceptProgression}
        suggestion={adaptiveSuggestion || { message: '' }}
        trainingType={trainingType}
      />

      <FitnessConnectionModal
        isOpen={showFitnessModal}
        onClose={() => setShowFitnessModal(false)}
      />

      {completedTrainingData && (
        <SocialShareModal
          isOpen={showSocialModal}
          onClose={handleSocialShareClose}
          trainingData={completedTrainingData}
        />
      )}
    </>
  );
};