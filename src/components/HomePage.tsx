import React, { useState, useEffect } from 'react';
import { Play, BarChart3, Zap, User, Users, Trophy, Target } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { getCurrentUser } from '../utils/cloudStorage';

interface HomePageProps {
  onStartTraining: () => void;
  onViewHistory: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartTraining, onViewHistory }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userGender, setUserGender] = useState<'male' | 'female'>('female');
  const user = getCurrentUser();

  // Detectar gênero do usuário ou alternar automaticamente
  useEffect(() => {
    const savedGender = localStorage.getItem('user_gender');
    if (savedGender) {
      setUserGender(savedGender as 'male' | 'female');
    } else {
      // Alternar entre masculino e feminino a cada 5 segundos para demonstração
      const interval = setInterval(() => {
        setUserGender(prev => prev === 'male' ? 'female' : 'male');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleStartTraining = () => {
    if (user) {
      onStartTraining();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = (email: string) => {
    // Após login bem-sucedido, iniciar treino
    onStartTraining();
  };

  const getRunnerImage = () => {
    if (userGender === 'male') {
      return (
        <div className="relative w-80 h-80 mx-auto mb-8">
          {/* Corredor masculino */}
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Pista de corrida */}
            <ellipse cx="200" cy="350" rx="180" ry="30" fill="rgba(59, 130, 246, 0.1)" />
            <ellipse cx="200" cy="350" rx="160" ry="25" fill="rgba(59, 130, 246, 0.2)" />
            
            {/* Sombra do corredor */}
            <ellipse cx="210" cy="340" rx="25" ry="8" fill="rgba(0, 0, 0, 0.2)" />
            
            {/* Corpo do corredor */}
            <g transform="translate(200, 200)">
              {/* Pernas */}
              <rect x="-8" y="80" width="6" height="40" fill="#8B4513" rx="3" transform="rotate(-20)" />
              <rect x="2" y="80" width="6" height="40" fill="#8B4513" rx="3" transform="rotate(15)" />
              
              {/* Shorts */}
              <rect x="-12" y="60" width="24" height="25" fill="#1E40AF" rx="3" />
              
              {/* Torso */}
              <rect x="-15" y="20" width="30" height="45" fill="#EF4444" rx="5" />
              
              {/* Braços */}
              <rect x="-25" y="25" width="6" height="35" fill="#8B4513" rx="3" transform="rotate(-30)" />
              <rect x="19" y="25" width="6" height="35" fill="#8B4513" rx="3" transform="rotate(45)" />
              
              {/* Cabeça */}
              <circle cx="0" cy="0" r="18" fill="#8B4513" />
              
              {/* Cabelo */}
              <path d="M -15 -10 Q 0 -25 15 -10 Q 10 -20 0 -18 Q -10 -20 -15 -10" fill="#2D1B69" />
              
              {/* Rosto */}
              <circle cx="-5" cy="-2" r="1.5" fill="#000" />
              <circle cx="5" cy="-2" r="1.5" fill="#000" />
              <path d="M -3 5 Q 0 8 3 5" stroke="#000" strokeWidth="1" fill="none" />
              
              {/* Tênis */}
              <ellipse cx="-8" cy="125" rx="8" ry="4" fill="#000" transform="rotate(-20)" />
              <ellipse cx="8" cy="125" rx="8" ry="4" fill="#000" transform="rotate(15)" />
            </g>
            
            {/* Linhas de movimento */}
            <path d="M 120 180 Q 140 175 160 180" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" fill="none" />
            <path d="M 125 200 Q 145 195 165 200" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" fill="none" />
            <path d="M 130 220 Q 150 215 170 220" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2" fill="none" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="relative w-80 h-80 mx-auto mb-8">
          {/* Corredora feminina */}
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Pista de corrida */}
            <ellipse cx="200" cy="350" rx="180" ry="30" fill="rgba(236, 72, 153, 0.1)" />
            <ellipse cx="200" cy="350" rx="160" ry="25" fill="rgba(236, 72, 153, 0.2)" />
            
            {/* Sombra da corredora */}
            <ellipse cx="210" cy="340" rx="25" ry="8" fill="rgba(0, 0, 0, 0.2)" />
            
            {/* Corpo da corredora */}
            <g transform="translate(200, 200)">
              {/* Pernas */}
              <rect x="-8" y="80" width="6" height="40" fill="#D2691E" rx="3" transform="rotate(-20)" />
              <rect x="2" y="80" width="6" height="40" fill="#D2691E" rx="3" transform="rotate(15)" />
              
              {/* Legging */}
              <rect x="-12" y="60" width="24" height="50" fill="#7C3AED" rx="3" />
              
              {/* Top esportivo */}
              <rect x="-15" y="20" width="30" height="45" fill="#EC4899" rx="5" />
              
              {/* Braços */}
              <rect x="-25" y="25" width="6" height="35" fill="#D2691E" rx="3" transform="rotate(-30)" />
              <rect x="19" y="25" width="6" height="35" fill="#D2691E" rx="3" transform="rotate(45)" />
              
              {/* Cabeça */}
              <circle cx="0" cy="0" r="18" fill="#D2691E" />
              
              {/* Cabelo longo */}
              <path d="M -18 -5 Q -25 -15 -20 -25 Q -15 -30 0 -22 Q 15 -30 20 -25 Q 25 -15 18 -5 Q 20 10 15 20 Q 10 25 5 20 Q 0 15 -5 20 Q -10 25 -15 20 Q -20 10 -18 -5" fill="#8B4513" />
              
              {/* Rabo de cavalo */}
              <ellipse cx="22" cy="5" rx="8" ry="15" fill="#8B4513" transform="rotate(20)" />
              
              {/* Rosto */}
              <circle cx="-5" cy="-2" r="1.5" fill="#000" />
              <circle cx="5" cy="-2" r="1.5" fill="#000" />
              <path d="M -3 5 Q 0 8 3 5" stroke="#000" strokeWidth="1" fill="none" />
              
              {/* Tênis */}
              <ellipse cx="-8" cy="125" rx="8" ry="4" fill="#EC4899" transform="rotate(-20)" />
              <ellipse cx="8" cy="125" rx="8" ry="4" fill="#EC4899" transform="rotate(15)" />
            </g>
            
            {/* Linhas de movimento */}
            <path d="M 120 180 Q 140 175 160 180" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="2" fill="none" />
            <path d="M 125 200 Q 145 195 165 200" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="2" fill="none" />
            <path d="M 130 220 Q 150 215 170 220" stroke="rgba(236, 72, 153, 0.2)" strokeWidth="2" fill="none" />
          </svg>
        </div>
      );
    }
  };

  const getGradientColors = () => {
    return userGender === 'male' 
      ? 'from-blue-400 via-blue-500 to-blue-600'
      : 'from-pink-400 via-purple-500 to-indigo-600';
  };

  const getAccentColor = () => {
    return userGender === 'male' ? 'blue' : 'pink';
  };

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-br ${getGradientColors()} relative overflow-hidden`}>
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0">
          {/* Círculos decorativos */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white bg-opacity-15 rounded-full blur-lg"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white bg-opacity-5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-28 h-28 bg-white bg-opacity-10 rounded-full blur-xl"></div>
          
          {/* Linhas de pista */}
          <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20">
            <div className="h-2 bg-white mb-4 transform -skew-y-1"></div>
            <div className="h-1 bg-white mb-6 transform -skew-y-1"></div>
            <div className="h-1 bg-white mb-8 transform -skew-y-1"></div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md w-full">
            {/* Ilustração do corredor/corredora */}
            {getRunnerImage()}

            {/* Logo/Icon */}
            <div className={`w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white border-opacity-30`}>
              <Zap className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Treinador de Corrida
            </h1>
            
            <p className="text-xl text-white text-opacity-90 mb-8 leading-relaxed drop-shadow-md">
              Melhore seu desempenho com treinos personalizados e acompanhamento inteligente
            </p>

            {/* User Status */}
            {user && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white border-opacity-30 shadow-xl">
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">
                    Bem-vindo, {user.name}!
                  </span>
                </div>
                <p className="text-sm text-white text-opacity-80 mt-1">
                  Seus dados estão sincronizados na nuvem
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleStartTraining}
                className="w-full bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-2xl border border-white border-opacity-30 hover:shadow-3xl"
              >
                <Play className="w-6 h-6" />
                <span className="text-lg">
                  {user ? 'Continuar Treino' : 'Iniciar Treino'}
                </span>
              </button>
              
              <button
                onClick={onViewHistory}
                className="w-full bg-white bg-opacity-15 backdrop-blur-sm hover:bg-opacity-25 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-xl border border-white border-opacity-20"
              >
                <BarChart3 className="w-6 h-6" />
                <span className="text-lg">Ver Histórico</span>
              </button>

              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full bg-white bg-opacity-15 backdrop-blur-sm hover:bg-opacity-25 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-xl border border-white border-opacity-20"
                >
                  <User className="w-6 h-6" />
                  <span className="text-lg">Criar Conta / Login</span>
                </button>
              )}
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 gap-4 text-left">
              <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white border-opacity-20">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 text-white mr-2" />
                  <h3 className="font-semibold text-white">Treinos Personalizados</h3>
                </div>
                <p className="text-sm text-white text-opacity-80">Planos adaptados ao seu nível e objetivos</p>
              </div>
              
              <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white border-opacity-20">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-white mr-2" />
                  <h3 className="font-semibold text-white">Sincronização na Nuvem</h3>
                </div>
                <p className="text-sm text-white text-opacity-80">Seus dados seguros e acessíveis em qualquer dispositivo</p>
              </div>
              
              <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white border-opacity-20">
                <div className="flex items-center mb-2">
                  <Trophy className="w-5 h-5 text-white mr-2" />
                  <h3 className="font-semibold text-white">Sistema de Conquistas</h3>
                </div>
                <p className="text-sm text-white text-opacity-80">Desbloqueie medalhas e mantenha a motivação</p>
              </div>

              <div className="bg-white bg-opacity-15 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white border-opacity-20">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-white mr-2" />
                  <h3 className="font-semibold text-white">Comunidade Ativa</h3>
                </div>
                <p className="text-sm text-white text-opacity-80">Compartilhe conquistas e motive outros corredores</p>
              </div>
            </div>

            {/* Gender Toggle for Demo */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  const newGender = userGender === 'male' ? 'female' : 'male';
                  setUserGender(newGender);
                  localStorage.setItem('user_gender', newGender);
                }}
                className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white text-sm px-4 py-2 rounded-lg transition-all border border-white border-opacity-30"
              >
                Alternar: {userGender === 'male' ? 'Corredor' : 'Corredora'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};