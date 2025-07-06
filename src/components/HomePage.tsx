import React, { useState } from 'react';
import { Play, BarChart3, Zap, User, Target, Trophy, Users } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { getCurrentUser } from '../utils/cloudStorage';

interface HomePageProps {
  onStartTraining: () => void;
  onViewHistory: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartTraining, onViewHistory }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const user = getCurrentUser();

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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {/* Logo/Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Zap className="w-12 h-12 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Treinador de Corrida
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Melhore seu desempenho com treinos personalizados e acompanhamento inteligente
          </p>

          {/* User Status */}
          {user && (
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mb-6 border border-blue-200">
              <div className="flex items-center justify-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Bem-vindo, {user.name}!
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Seus dados estão sincronizados na nuvem
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleStartTraining}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Play className="w-6 h-6" />
              <span className="text-lg">
                {user ? 'Continuar Treino' : 'Iniciar Treino'}
              </span>
            </button>
            
            <button
              onClick={onViewHistory}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-lg">Ver Histórico</span>
            </button>

            {!user && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <User className="w-6 h-6" />
                <span className="text-lg">Criar Conta / Login</span>
              </button>
            )}
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 gap-4 text-left">
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Treinos Personalizados</h3>
              </div>
              <p className="text-sm text-gray-600">Planos adaptados ao seu nível e objetivos</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-2">
                <Zap className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Sincronização na Nuvem</h3>
              </div>
              <p className="text-sm text-gray-600">Seus dados seguros e acessíveis em qualquer dispositivo</p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-2">
                <Trophy className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Sistema de Conquistas</h3>
              </div>
              <p className="text-sm text-gray-600">Desbloqueie medalhas e mantenha a motivação</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-2">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-800">Comunidade Ativa</h3>
              </div>
              <p className="text-sm text-gray-600">Compartilhe conquistas e motive outros corredores</p>
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