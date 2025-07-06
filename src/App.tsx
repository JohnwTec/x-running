import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { ProfileSetup } from './components/ProfileSetup';
import { GoalSetup } from './components/GoalSetup';
import { TrainingSelection } from './components/TrainingSelection';
import { IntervalSelection } from './components/IntervalSelection';
import { TrainingSession } from './components/TrainingSession';
import { TrainingHistory } from './components/TrainingHistory';
import { Dashboard } from './components/Dashboard';
import { UserProfile, Goal, TrainingProgress, WeeklyTrainings, Achievement } from './types';
import { 
  saveUserProfile, 
  getUserProfile, 
  saveGoal, 
  getGoal,
  saveTrainingProgress,
  getTrainingProgress,
  saveWeeklyTrainings,
  getWeeklyTrainings,
  saveAchievements,
  getAchievements,
  saveCurrentWeek,
  getCurrentWeek,
  loadCloudDataIfAvailable,
  syncPendingData
} from './utils/storage';
import { getCurrentUser, checkConnectivity } from './utils/cloudStorage';
import { checkAchievements } from './utils/achievements';
import { calculateWeeklyStats } from './utils/calculations';

type Screen = 'home' | 'dashboard' | 'setup' | 'setGoal' | 'chooseTraining' | 'chooseIntervalDistance' | 'training' | 'history';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [trainingType, setTrainingType] = useState<'warmup' | 'longa' | 'intervalado' | null>(null);
  const [intervalDistance, setIntervalDistance] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [weeklyTrainings, setWeeklyTrainings] = useState<WeeklyTrainings>({ longa: 0, intervalado: 0, weekStart: new Date() });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on app start
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Primeiro, carregar dados locais
      const loadedProfile = getUserProfile();
      const loadedGoal = getGoal();
      const loadedProgress = getTrainingProgress();
      const loadedWeekly = getWeeklyTrainings();
      const loadedAchievements = getAchievements();
      const loadedWeek = getCurrentWeek();

      if (loadedProfile) setUserProfile(loadedProfile);
      if (loadedGoal) setGoal(loadedGoal);
      setTrainingProgress(loadedProgress);
      setWeeklyTrainings(loadedWeekly);
      setAchievements(loadedAchievements);
      setCurrentWeek(loadedWeek);

      // Se tem usuário logado e está online, tentar carregar dados da nuvem
      const user = getCurrentUser();
      if (user && checkConnectivity()) {
        try {
          await loadCloudDataIfAvailable();
          await syncPendingData();
          
          // Recarregar dados após sincronização
          const updatedProfile = getUserProfile();
          const updatedGoal = getGoal();
          const updatedProgress = getTrainingProgress();
          const updatedAchievements = getAchievements();
          
          if (updatedProfile) setUserProfile(updatedProfile);
          if (updatedGoal) setGoal(updatedGoal);
          setTrainingProgress(updatedProgress);
          setAchievements(updatedAchievements);
        } catch (error) {
          console.error('Erro ao sincronizar dados:', error);
        }
      }

      // Se já tem perfil e meta, vai direto para o dashboard
      const finalProfile = getUserProfile();
      const finalGoal = getGoal();
      if (finalProfile && finalGoal) {
        setScreen('dashboard');
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStartTraining = () => {
    if (userProfile && goal) {
      setScreen('dashboard');
    } else {
      setScreen('setup');
    }
  };

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
    setScreen('setGoal');
  };

  const handleGoalComplete = (newGoal: Goal) => {
    setGoal(newGoal);
    saveGoal(newGoal);
    setScreen('dashboard');
  };

  const handleTrainingSelect = (type: 'warmup' | 'longa' | 'intervalado', distance?: string) => {
    setTrainingType(type);
    if (distance) {
      setIntervalDistance(distance);
    }
    setScreen('training');
  };

  const handleIntervalSelect = () => {
    setScreen('chooseIntervalDistance');
  };

  const handleIntervalDistanceSelect = (distance: string) => {
    setIntervalDistance(distance);
    setTrainingType('intervalado');
    setScreen('training');
  };

  const handleTrainingComplete = (data: { distance: number; time: number; pace: number; difficulty?: 'easy' | 'normal' | 'hard' }) => {
    if (!userProfile || !trainingType) return;

    // Se foi só aquecimento, volta para seleção
    if (trainingType === 'warmup') {
      setScreen('chooseTraining');
      return;
    }

    // Create new training record
    const newTraining: TrainingProgress = {
      id: Date.now().toString(),
      date: new Date(),
      pace: data.pace,
      distance: data.distance,
      type: trainingType as 'longa' | 'intervalado',
      duration: data.time,
      difficulty: data.difficulty
    };

    const updatedProgress = [...trainingProgress, newTraining];
    setTrainingProgress(updatedProgress);
    saveTrainingProgress(updatedProgress);

    // Update weekly trainings
    const updatedWeekly = {
      ...weeklyTrainings,
      [trainingType]: weeklyTrainings[trainingType] + 1
    };
    setWeeklyTrainings(updatedWeekly);
    saveWeeklyTrainings(updatedWeekly);

    // Check for new achievements
    const weeklyStats = calculateWeeklyStats(updatedProgress);
    const newAchievements = checkAchievements(updatedProgress, weeklyStats, achievements);
    
    if (newAchievements.length > 0) {
      const allAchievements = [...achievements, ...newAchievements];
      setAchievements(allAchievements);
      saveAchievements(allAchievements);
      
      // Show achievement notification
      newAchievements.forEach(achievement => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🏆 Nova Conquista: ${achievement.name}`, {
            body: achievement.description,
            icon: '/icon-192x192.png'
          });
        }
      });
    }

    setScreen('dashboard');
  };

  const handleViewHistory = () => {
    setScreen('history');
  };

  const handleBackToHome = () => {
    setScreen('home');
  };

  const handleBackToDashboard = () => {
    setScreen('dashboard');
  };

  const handleBackToTrainingSelection = () => {
    setScreen('chooseTraining');
  };

  const handleNavigate = (newScreen: string) => {
    setScreen(newScreen as Screen);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Carregando...</h2>
          <p className="text-gray-600">Sincronizando seus dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {screen === 'home' && (
        <HomePage 
          onStartTraining={handleStartTraining}
          onViewHistory={handleViewHistory}
        />
      )}

      {screen === 'dashboard' && userProfile && goal && (
        <Dashboard
          userProfile={userProfile}
          goal={goal}
          trainingProgress={trainingProgress}
          weeklyTrainings={weeklyTrainings}
          achievements={achievements}
          onNavigate={handleNavigate}
        />
      )}
      
      {screen === 'setup' && (
        <ProfileSetup 
          onProfileComplete={handleProfileComplete} 
          onBack={() => setScreen('home')}
        />
      )}
      
      {screen === 'setGoal' && userProfile && (
        <GoalSetup 
          userProfile={userProfile}
          onGoalComplete={handleGoalComplete}
          onBack={() => setScreen('setup')}
        />
      )}
      
      {screen === 'chooseTraining' && userProfile && goal && (
        <TrainingSelection
          userProfile={userProfile}
          goal={goal}
          onTrainingSelect={handleTrainingSelect}
          onIntervalSelect={handleIntervalSelect}
          onBack={handleBackToDashboard}
        />
      )}
      
      {screen === 'chooseIntervalDistance' && (
        <IntervalSelection
          onIntervalSelect={handleIntervalDistanceSelect}
          onBack={handleBackToTrainingSelection}
        />
      )}
      
      {screen === 'training' && userProfile && trainingType && (
        <TrainingSession
          userProfile={userProfile}
          trainingType={trainingType}
          intervalDistance={intervalDistance || undefined}
          trainingProgress={trainingProgress}
          onTrainingComplete={handleTrainingComplete}
          onBack={handleBackToTrainingSelection}
        />
      )}
      
      {screen === 'history' && (
        <TrainingHistory
          trainingProgress={trainingProgress}
          achievements={achievements}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}

export default App;