import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle, TrendingUp, Target, X, Minimize2 } from 'lucide-react';
import { aiCoach } from '../utils/aiCoach';
import { UserProfile, TrainingProgress } from '../types';

interface AICoachWidgetProps {
  userProfile: UserProfile;
  recentTrainings: TrainingProgress[];
  onOpenFullCoach: () => void;
}

export const AICoachWidget: React.FC<AICoachWidgetProps> = ({
  userProfile,
  recentTrainings,
  onOpenFullCoach
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickTip, setQuickTip] = useState<string>('');
  const [lastTrainingAnalysis, setLastTrainingAnalysis] = useState<any>(null);

  useEffect(() => {
    generateQuickTip();
    analyzeLastTraining();
  }, [recentTrainings]);

  const generateQuickTip = () => {
    const tips = [
      `${userProfile.name}, lembre-se: consistência é mais importante que intensidade!`,
      'Hidrate-se bem antes, durante e após o treino.',
      'Um bom aquecimento previne lesões e melhora performance.',
      'Escute seu corpo - descanso também é treino.',
      'Varie seus treinos para evitar monotonia e overuse.',
      'Mantenha um pace conversacional em 80% dos seus treinos.',
      'O sono é quando seu corpo se adapta ao treino. Priorize-o!'
    ];

    // Dica baseada no último treino
    const lastTraining = recentTrainings[recentTrainings.length - 1];
    if (lastTraining) {
      const daysSince = Math.floor((Date.now() - new Date(lastTraining.date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 0) {
        setQuickTip('Ótimo treino hoje! Lembre-se de se hidratar e fazer um cool-down adequado.');
      } else if (daysSince === 1) {
        setQuickTip('Como você se sente após o treino de ontem? Considere um treino leve ou descanso ativo.');
      } else if (daysSince >= 3) {
        setQuickTip('Que tal retomar os treinos? Seu corpo já teve tempo para se recuperar.');
      } else {
        setQuickTip(tips[Math.floor(Math.random() * tips.length)]);
      }
    } else {
      setQuickTip('Pronto para começar sua jornada? Vamos criar um plano personalizado para você!');
    }
  };

  const analyzeLastTraining = async () => {
    if (recentTrainings.length === 0) return;

    const lastTraining = recentTrainings[recentTrainings.length - 1];
    const context = {
      userProfile,
      recentTrainings,
      weeklyStats: [],
      currentGoal: { distance: 10, months: 3, type: 'suggested' as const }
    };

    try {
      const analysis = await aiCoach.analyzeTrainingPerformance(lastTraining, context);
      setLastTrainingAnalysis(analysis);
    } catch (error) {
      console.error('Erro ao analisar último treino:', error);
    }
  };

  const getPerformanceColor = (performance: string) => {
    const colors = {
      excellent: 'text-green-600 bg-green-50',
      good: 'text-green-500 bg-green-50',
      average: 'text-yellow-600 bg-yellow-50',
      below_average: 'text-orange-600 bg-orange-50',
      poor: 'text-red-600 bg-red-50'
    };
    return colors[performance] || colors.average;
  };

  const getPerformanceEmoji = (performance: string) => {
    const emojis = {
      excellent: '🏆',
      good: '👍',
      average: '👌',
      below_average: '😐',
      poor: '😔'
    };
    return emojis[performance] || '👌';
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
        >
          <Brain className="w-6 h-6" />
        </button>
        
        {/* Notification badge */}
        {lastTrainingAnalysis && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            !
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-2xl shadow-xl border z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">IA Coach</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenFullCoach}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Abrir Coach Completo"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Quick Tip */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-start">
            <MessageCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">{quickTip}</p>
          </div>
        </div>

        {/* Last Training Analysis */}
        {lastTrainingAnalysis && (
          <div className="border rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Último Treino
            </h4>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${getPerformanceColor(lastTrainingAnalysis.performance)}`}>
              {getPerformanceEmoji(lastTrainingAnalysis.performance)} {lastTrainingAnalysis.performance.replace('_', ' ').toUpperCase()}
            </div>
            <p className="text-sm text-gray-700 mb-2">{lastTrainingAnalysis.feedback}</p>
            <p className="text-xs text-gray-600">{lastTrainingAnalysis.nextTrainingAdvice}</p>
            
            {lastTrainingAnalysis.recoveryTime > 24 && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2">
                <p className="text-xs text-yellow-800">
                  ⏰ Recuperação recomendada: {lastTrainingAnalysis.recoveryTime}h
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {recentTrainings.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-gray-800">{recentTrainings.length}</div>
              <div className="text-xs text-gray-600">Treinos</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-gray-800">
                {recentTrainings.slice(-7).reduce((sum, t) => sum + t.distance, 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">km (7 dias)</div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onOpenFullCoach}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
        >
          Obter Recomendação Completa
        </button>
      </div>
    </div>
  );
};