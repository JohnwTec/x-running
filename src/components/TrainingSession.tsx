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
      console.log('Inicializando GPS...');
      const hasPermission = await gpsTracker.requestPermission();
      if (hasPermission) {
        console.log('Permissão de GPS concedida');
        // Mostrar notificação de sucesso
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('GPS Conectado', { body: 'GPS conectado com sucesso! Pronto para rastrear seu treino.' });
        }
      } else {
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

  // Verificar qualidade do GPS periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (gpsState.isTracking && gpsState.accuracy > 30) {
        console.warn('GPS com baixa precisão:', gpsState.accuracy, 'm');
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => clearInterval(interval);
  }, [gpsState.isTracking, gpsState.accuracy]);

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
    if (!gpsState.isGPSEnabled) {
      alert('GPS não está disponível. Ative o GPS nas configurações do dispositivo e recarregue a página.');
      return;
    }
    
    setIsRunning(true);
    gpsTracker.startTracking();
  };

  const handlePause = () => {
    setIsRunning(false);
    gpsTracker.stopTracking();
  };

  const handleSave = () => {
    if (timer === 0 && distance === 0) {
      alert('Nenhum dado para salvar!');
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    const trainingData = {
      distance,
      time: timer,
      pace,
      type: trainingType,
      date: new Date(),
      saved: true
    };
    
    setSavedTrainingData(trainingData);
    setShowSaveConfirm(false);
    
    // Mostrar feedback visual
    alert('Treino salvo com sucesso! Você pode continuar ou finalizar.');
  };

  const handleRestart = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    setIsRunning(false);
    gpsTracker.stopTracking();
    gpsTracker.reset();
    setTimer(0);
    setDistance(0);
    setIntervalCount(0);
    setHeartRate(null);
    setSavedTrainingData(null);
    setShowRestartConfirm(false);
  };

  const handleStop = async () => {
    setIsRunning(false);
    gpsTracker.stopTracking();
    
    // Se não há dados salvos e não há progresso, não fazer nada
    if (!savedTrainingData && timer === 0 && distance === 0) {
      if (onBack) onBack();
      return;
    }
    
    // Usar dados salvos se disponível, senão usar dados atuais
    const finalData = savedTrainingData || {
      distance,
      time: timer,
      pace,
      type: trainingType,
      date: new Date()
    };
    
    // Avaliar dificuldade baseada no pace real vs sugerido
    let difficulty: 'easy' | 'normal' | 'hard' = 'normal';
    if (currentPace > 0) {
      const paceRatio = finalData.pace / currentPace;
      if (paceRatio <= 0.9) difficulty = 'easy';
      else if (paceRatio >= 1.1) difficulty = 'hard';
    }

    const trainingData = { 
      distance: finalData.distance, 
      time: finalData.time, 
      pace: finalData.pace, 
      difficulty,
      type: trainingType,
      date: finalData.date
    };

    // Tentar enviar para Strava se conectado
    const connections = fitnessIntegration.getConnectionStatus();
    if (connections.strava && finalData.distance > 0) {
      try {
        await fitnessIntegration.uploadToStrava({
          type: trainingType,
          startTime: new Date(Date.now() - finalData.time * 1000),
          endTime: new Date(),
          distance: finalData.distance,
          duration: finalData.time,
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
    return <WarmupSession onComplete={handleWarmupComplete} onBack={onBack} />;
  }

  // Se era só aquecimento e já foi completado, não mostra mais nada
  if (trainingType === 'warmup') {
    return null;
  }


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-800 flex-1 text-center">
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
            {/* GPS Status - Componente melhorado */}
            <GPSStatusIndicator gpsState={gpsState} />

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

          {/* GPS Warning */}
          {gpsState.isTracking && gpsState.signalStrength === 'poor' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Sinal GPS fraco</p>
                  <p className="text-xs text-yellow-700">Mova-se para área aberta para melhor precisão</p>
                </div>
              </div>
            </div>
          )}

          {/* Saved Training Indicator */}
          {savedTrainingData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <Save className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800 font-medium">
                  Treino salvo: {savedTrainingData.distance.toFixed(2)}km em {formatTime(savedTrainingData.time)}
                </span>
              </div>
            </div>
          )}

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
              <div className="flex items-center justify-center mb-1">
                <Navigation className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-gray-600">Distância GPS</span>
              </div>
              <p className="text-lg font-bold text-blue-600">{gpsState.totalDistance.toFixed(3)}</p>
              <p className="text-xs text-gray-500">km (GPS)</p>
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
          <div className="space-y-3">
            {/* Primary Controls */}
            <div className="flex space-x-3">
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

            {/* Secondary Controls */}
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={timer === 0 && distance === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </button>
              
              <button
                onClick={handleRestart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recomeçar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* GPS Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <GPSDebugPanel gpsTracker={gpsTracker} gpsState={gpsState} />
      )}

      {/* Confirmation Modals */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <Save className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Salvar Treino</h3>
              <p className="text-gray-600">
                Salvar progresso atual: {distance.toFixed(2)}km em {formatTime(timer)}?
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Recomeçar Treino</h3>
              <p className="text-gray-600">
                Isso irá apagar todo o progresso atual. Tem certeza?
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Recomeçar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Modals */}
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