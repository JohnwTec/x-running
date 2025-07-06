import React from 'react';
import { BarChart3, Trophy, ArrowLeft, TrendingUp } from 'lucide-react';
import { TrainingProgress, Achievement } from '../types';

interface TrainingHistoryProps {
  trainingProgress: TrainingProgress[];
  achievements: Achievement[];
  onBack: () => void;
}

export const TrainingHistory: React.FC<TrainingHistoryProps> = ({ 
  trainingProgress, 
  achievements, 
  onBack 
}) => {
  const totalDistance = trainingProgress.reduce((sum, training) => sum + training.distance, 0);
  const totalTime = trainingProgress.reduce((sum, training) => sum + training.duration, 0);
  const averagePace = trainingProgress.length > 0 
    ? trainingProgress.reduce((sum, training) => sum + training.pace, 0) / trainingProgress.length 
    : 0;

  const recentTrainings = trainingProgress.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Histórico de Treinos</h2>
              <p className="text-gray-600">Acompanhe seu progresso</p>
            </div>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        {trainingProgress.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum treino registrado ainda</p>
            <p className="text-gray-400 text-sm mt-2">Comece seu primeiro treino para ver estatísticas aqui!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{totalDistance.toFixed(1)}</p>
                <p className="text-xs text-blue-800">km total</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{Math.floor(totalTime / 60)}</p>
                <p className="text-xs text-green-800">min total</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{averagePace.toFixed(1)}</p>
                <p className="text-xs text-purple-800">pace médio</p>
              </div>
            </div>

            {/* Recent Trainings */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Treinos Recentes
              </h3>
              <div className="space-y-3">
                {recentTrainings.map((training, index) => (
                  <div key={training.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800 capitalize">{training.type}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(training.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Distância:</span>
                        <p className="font-medium">{training.distance.toFixed(2)} km</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tempo:</span>
                        <p className="font-medium">{Math.floor(training.duration / 60)}:{(training.duration % 60).toString().padStart(2, '0')}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Pace:</span>
                        <p className="font-medium">{training.pace.toFixed(1)} min/km</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Conquistas
              </h3>
              {achievements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma conquista desbloqueada ainda</p>
              ) : (
                <div className="space-y-2">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-2xl mr-3">{achievement.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-800">{achievement.name}</h4>
                        <p className="text-sm text-yellow-700">{achievement.description}</p>
                      </div>
                      <span className="text-xs text-yellow-600">
                        {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};