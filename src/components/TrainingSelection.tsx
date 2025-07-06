import React from 'react';
import { Play, Zap, RotateCcw, Target, ArrowLeft } from 'lucide-react';
import { UserProfile, Goal } from '../types';
import { getAgeGroup } from '../utils/calculations';

interface TrainingSelectionProps {
  userProfile: UserProfile;
  goal: Goal;
  onTrainingSelect: (type: 'warmup' | 'longa' | 'intervalado', distance?: string) => void;
  onIntervalSelect: () => void;
  onBack?: () => void;
}

export const TrainingSelection: React.FC<TrainingSelectionProps> = ({ 
  userProfile, 
  goal, 
  onTrainingSelect, 
  onIntervalSelect,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha seu Treino</h2>
              <p className="text-gray-600">Nível: {userProfile.level} ({getAgeGroup(userProfile.age)})</p>
              <p className="text-sm text-gray-500 mt-2">Meta: {goal.distance} km em {goal.months} meses</p>
            </div>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onTrainingSelect('warmup')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg"
          >
            <RotateCcw className="w-6 h-6" />
            <div className="text-left">
              <div className="font-bold">Aquecimento</div>
              <div className="text-sm opacity-90">Prepare-se para o treino</div>
            </div>
          </button>

          <button
            onClick={() => onTrainingSelect('longa')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg"
          >
            <Play className="w-6 h-6" />
            <div className="text-left">
              <div className="font-bold">Corrida Longa</div>
              <div className="text-sm opacity-90">Desenvolva resistência</div>
            </div>
          </button>

          <button
            onClick={onIntervalSelect}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-3 shadow-lg"
          >
            <Zap className="w-6 h-6" />
            <div className="text-left">
              <div className="font-bold">Treino Intervalado</div>
              <div className="text-sm opacity-90">Melhore velocidade e potência</div>
            </div>
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Dica do Dia</h3>
          <p className="text-sm text-gray-600">
            Sempre faça aquecimento antes dos treinos intensos para evitar lesões e melhorar o desempenho.
          </p>
        </div>
      </div>
    </div>
  );
};