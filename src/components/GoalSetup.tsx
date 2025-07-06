import React, { useState } from 'react';
import { Target, Play, ArrowLeft } from 'lucide-react';
import { UserProfile, Goal } from '../types';
import { getAgeGroup, calculateFCMax } from '../utils/calculations';
import { getSuggestedGoal, getProgressionPlan } from '../utils/trainingPlans';

interface GoalSetupProps {
  userProfile: UserProfile;
  onGoalComplete: (goal: Goal) => void;
  onBack?: () => void;
}

export const GoalSetup: React.FC<GoalSetupProps> = ({ userProfile, onGoalComplete, onBack }) => {
  const suggestedGoal = getSuggestedGoal(userProfile.level!, userProfile.age);
  const [goal, setGoal] = useState<Goal>({
    type: 'suggested',
    distance: suggestedGoal.distance,
    months: suggestedGoal.months
  });

  const handleSubmit = () => {
    onGoalComplete(goal);
  };

  const progressionPlan = getProgressionPlan(goal.distance, goal.months, userProfile.level!);

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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Defina sua Meta</h2>
              <p className="text-gray-600">Vamos estabelecer seus objetivos</p>
            </div>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Perfil:</span> {userProfile.level} ({getAgeGroup(userProfile.age)})
            </p>
            <p className="text-sm text-blue-800">
              <span className="font-medium">FCmáx estimada:</span> {calculateFCMax(userProfile.age)} bpm
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Escolha uma meta:</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="goalType"
                  value="suggested"
                  checked={goal.type === 'suggested'}
                  onChange={(e) => setGoal({ 
                    ...goal, 
                    type: e.target.value as 'suggested' | 'manual',
                    distance: suggestedGoal.distance,
                    months: suggestedGoal.months
                  })}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-800">Meta sugerida</p>
                  <p className="text-sm text-gray-600">{suggestedGoal.distance} km em {suggestedGoal.months} meses</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="goalType"
                  value="manual"
                  checked={goal.type === 'manual'}
                  onChange={(e) => setGoal({ ...goal, type: e.target.value as 'suggested' | 'manual' })}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-800">Meta personalizada</p>
                  <p className="text-sm text-gray-600">Defina sua própria meta</p>
                </div>
              </label>
            </div>
          </div>

          {goal.type === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Distância alvo (km)</label>
                <input
                  type="number"
                  value={goal.distance}
                  onChange={(e) => setGoal({ ...goal, distance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="21"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prazo (meses)</label>
                <input
                  type="number"
                  value={goal.months}
                  onChange={(e) => setGoal({ ...goal, months: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="6"
                />
              </div>
            </div>
          )}

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Plano de Progressão</h3>
            <p className="text-sm text-green-700">
              Distâncias semanais: {progressionPlan.slice(0, 4).join(', ')} km...
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={goal.type === 'manual' && (!goal.distance || !goal.months)}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Confirmar Meta</span>
          </button>
        </div>
      </div>
    </div>
  );
};