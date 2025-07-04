import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar, Award, Activity, Clock, User, Scale, Settings, Bluetooth } from 'lucide-react';
import { UserProfile, Goal, TrainingProgress, Achievement } from '../types';
import { formatTime, calculateIMC, getIMCCategory, getStatsComparison } from '../utils/calculations';
import { SyncStatus } from './SyncStatus';
import { AuthModal } from './AuthModal';
import { FitnessConnectionModal } from './FitnessConnectionModal';
import { getCurrentUser, checkConnectivity, getLastSync } from '../utils/cloudStorage';
import { syncPendingData, loadCloudDataIfAvailable } from '../utils/storage';
import { fitnessIntegration } from '../utils/fitnessIntegration';

interface DashboardProps {
  userProfile: UserProfile;
  goal: Goal;
  trainingProgress: TrainingProgress[];
  weeklyTrainings: { longa: number; intervalado: number; weekStart: Date };
  achievements: Achievement[];
  onNavigate: (screen: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  goal,
  trainingProgress,
  weeklyTrainings,
  achievements,
  onNavigate
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFitnessModal, setShowFitnessModal] = useState(false);
  const [isOnline, setIsOnline] = useState(checkConnectivity());
  const [lastSync, setLastSync] = useState(getLastSync());
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [fitnessConnections, setFitnessConnections] = useState({
    appleHealth: false,
    smartwatch: false,
    strava: false,
    zepp: false
  });

  const user = getCurrentUser();
  const stats = getStatsComparison(trainingProgress);
  const goalProgress = (stats.total.distance / goal.distance) * 100;
  const imc = parseFloat(calculateIMC(userProfile.weight, userProfile.height));
  const imcInfo = getIMCCategory(imc);
  const recentAchievements = achievements.slice(-3);

  // Verificar conexões de fitness
  useEffect(() => {
    setFitnessConnections(fitnessIntegration.getConnectionStatus());
  }, []);

  // Monitorar conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        setSyncInProgress(true);
        syncPendingData().finally(() => {
          setSyncInProgress(false);
          setLastSync(getLastSync());
        });
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Sincronização automática periódica
  useEffect(() => {
    if (!user || !isOnline) return;

    const interval = setInterval(async () => {
      if (!syncInProgress) {
        setSyncInProgress(true);
        await syncPendingData();
        setSyncInProgress(false);
        setLastSync(getLastSync());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isOnline, syncInProgress]);

  const handleAuthSuccess = async (email: string) => {
    setSyncInProgress(true);
    await loadCloudDataIfAvailable();
    setSyncInProgress(false);
    setLastSync(getLastSync());
    window.location.reload();
  };

  const connectedDevicesCount = Object.values(fitnessConnections).filter(Boolean).length;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Sync Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Olá, {userProfile.name}!</h1>
                <p className="text-gray-600 mt-1">Nível: {userProfile.level}</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${imcInfo.color}`}>
                  <Scale className="w-4 h-4 mr-1" />
                  IMC: {imc} - {imcInfo.category}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Meta Atual</p>
                  <p className="text-2xl font-bold text-blue-600">{goal.distance} km</p>
                  <p className="text-sm text-gray-500">em {goal.months} meses</p>
                </div>
                <SyncStatus 
                  isOnline={isOnline}
                  lastSync={lastSync}
                  userEmail={user?.email || null}
                />
              </div>
            </div>

            {/* Fitness Connections Status */}
            <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Bluetooth className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Dispositivos Conectados</h3>
                  <p className="text-sm text-gray-600">
                    {connectedDevicesCount > 0 
                      ? `${connectedDevicesCount} dispositivo(s) conectado(s)`
                      : 'Nenhum dispositivo conectado'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFitnessModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Gerenciar
              </button>
            </div>

            {/* Account Status */}
            {!user && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-yellow-800">⚠️ Dados não sincronizados</h3>
                    <p className="text-sm text-yellow-700">
                      Faça login para salvar seus dados na nuvem e acessá-los em qualquer dispositivo
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Fazer Login
                  </button>
                </div>
              </div>
            )}

            {user && !isOnline && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-orange-800">Modo Offline</h3>
                    <p className="text-sm text-orange-700">
                      Seus dados estão sendo salvos localmente e serão sincronizados quando voltar online
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Comparison */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Hoje</p>
                <p className="text-2xl font-bold text-blue-600">{stats.today.distance.toFixed(1)} km</p>
                <p className="text-xs text-gray-400">{stats.today.count} treino(s)</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Esta Semana</p>
                <p className="text-2xl font-bold text-green-600">{stats.week.distance.toFixed(1)} km</p>
                <p className="text-xs text-gray-400">{stats.week.count} treino(s)</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Este Mês</p>
                <p className="text-2xl font-bold text-purple-600">{stats.month.distance.toFixed(1)} km</p>
                <p className="text-xs text-gray-400">{stats.month.count} treino(s)</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total.distance.toFixed(1)} km</p>
                <p className="text-xs text-gray-400">{stats.total.count} treino(s)</p>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              Progresso da Meta
            </h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progresso</span>
                <span>{goalProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(goalProgress, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.total.distance.toFixed(1)} km</p>
                <p className="text-sm text-gray-500">Completado</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">{(goal.distance - stats.total.distance).toFixed(1)} km</p>
                <p className="text-sm text-gray-500">Restante</p>
              </div>
            </div>
          </div>

          {/* IMC Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-6 h-6 mr-2 text-purple-600" />
              Informações de Saúde
            </h2>
            <div className={`p-4 rounded-lg ${imcInfo.color}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Índice de Massa Corporal (IMC)</span>
                <span className="text-2xl font-bold">{imc}</span>
              </div>
              <p className="text-sm">{imcInfo.description}</p>
            </div>
          </div>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2 text-yellow-600" />
                Conquistas Recentes
              </h2>
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <span className="text-2xl mr-3">{achievement.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{achievement.name}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-600" />
              Resumo Semanal
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{weeklyTrainings.longa + weeklyTrainings.intervalado}</p>
                <p className="text-sm text-gray-500">Treinos Realizados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{weeklyTrainings.longa}</p>
                <p className="text-sm text-gray-500">Corridas Longas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{weeklyTrainings.intervalado}</p>
                <p className="text-sm text-gray-500">Intervalados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.total.averagePace.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Pace Médio</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('chooseTraining')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <Activity className="w-6 h-6" />
                <span>Iniciar Treino</span>
              </div>
            </button>
            
            <button
              onClick={() => onNavigate('history')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-6 h-6" />
                <span>Ver Estatísticas</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <FitnessConnectionModal
        isOpen={showFitnessModal}
        onClose={() => setShowFitnessModal(false)}
      />
    </>
  );
};