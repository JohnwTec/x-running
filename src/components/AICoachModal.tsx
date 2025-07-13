import React, { useState, useEffect } from 'react';
import { Brain, Zap, Target, TrendingUp, AlertTriangle, Lightbulb, X, Settings, Key } from 'lucide-react';
import { aiCoach, AICoachAnalysis, AICoachContext } from '../utils/aiCoach';
import { UserProfile, TrainingProgress, Goal, WeeklyStats } from '../types';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecommendationAccept: (analysis: AICoachAnalysis) => void;
  userProfile: UserProfile;
  recentTrainings: TrainingProgress[];
  weeklyStats: WeeklyStats[];
  currentGoal: Goal;
  weatherData?: any;
  healthMetrics?: {
    sleepQuality?: number;
    stressLevel?: number;
    energyLevel?: number;
  };
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  onRecommendationAccept,
  userProfile,
  recentTrainings,
  weeklyStats,
  currentGoal,
  weatherData,
  healthMetrics
}) => {
  const [analysis, setAnalysis] = useState<AICoachAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    if (isOpen && !aiCoach.hasApiKey()) {
      setShowApiKeySetup(true);
    } else if (isOpen) {
      generateRecommendation();
      analyzeTrends();
    }
  }, [isOpen]);

  const generateRecommendation = async () => {
    setLoading(true);
    try {
      const context: AICoachContext = {
        userProfile,
        recentTrainings,
        weeklyStats,
        currentGoal,
        weatherData,
        sleepQuality: healthMetrics?.sleepQuality,
        stressLevel: healthMetrics?.stressLevel,
        energyLevel: healthMetrics?.energyLevel
      };

      const recommendation = await aiCoach.getPersonalizedRecommendation(context);
      setAnalysis(recommendation);
    } catch (error) {
      console.error('Erro ao gerar recomendação:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrends = () => {
    const trendAnalysis = aiCoach.analyzeTrends(recentTrainings);
    setTrends(trendAnalysis);
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      aiCoach.setApiKey(apiKey.trim());
      setShowApiKeySetup(false);
      generateRecommendation();
    }
  };

  const getTrainingTypeColor = (type: string) => {
    const colors = {
      rest: 'bg-gray-100 text-gray-800',
      recovery: 'bg-blue-100 text-blue-800',
      easy: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      intense: 'bg-red-100 text-red-800'
    };
    return colors[type] || colors.moderate;
  };

  const getTrainingTypeIcon = (type: string) => {
    const icons = {
      rest: '😴',
      recovery: '🚶',
      easy: '🏃',
      moderate: '🏃‍♂️',
      intense: '🔥'
    };
    return icons[type] || '🏃‍♂️';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-600" />
            IA Coach Personalizado
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowApiKeySetup(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Configurar API Key"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {showApiKeySetup && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Configurar IA Coach
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Para usar o IA Coach personalizado, você precisa de uma API Key do OpenAI.
              Sem ela, usaremos recomendações baseadas em regras.
            </p>
            <div className="flex space-x-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleApiKeySubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Salvar
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                Obter API Key do OpenAI →
              </a>
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Analisando seus dados...</h3>
            <p className="text-gray-600">A IA está processando seu histórico para gerar recomendações personalizadas</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Recomendação Principal */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-purple-600" />
                  Recomendação para Hoje
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrainingTypeColor(analysis.trainingType)}`}>
                    {getTrainingTypeIcon(analysis.trainingType)} {analysis.trainingType.toUpperCase()}
                  </span>
                  <div className="text-sm text-gray-600">
                    Confiança: {analysis.confidence}%
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-gray-800 mb-4">{analysis.recommendation}</p>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Justificativa:</h4>
                <p className="text-gray-700">{analysis.reasoning}</p>
              </div>

              {(analysis.targetPace || analysis.targetDistance) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {analysis.targetPace && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.targetPace.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">min/km sugerido</div>
                    </div>
                  )}
                  {analysis.targetDistance && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.targetDistance.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">km sugeridos</div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => onRecommendationAccept(analysis)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
              >
                Aceitar Recomendação e Iniciar Treino
              </button>
            </div>

            {/* Avisos */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Avisos Importantes
                </h4>
                <ul className="space-y-1">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-700 text-sm flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dicas */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Dicas Personalizadas
              </h4>
              <ul className="space-y-1">
                {analysis.tips.map((tip, index) => (
                  <li key={index} className="text-green-700 text-sm flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Análise de Tendências */}
            {trends && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Análise de Progresso
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${trends.paceImprovement > 0 ? 'text-green-600' : trends.paceImprovement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {trends.paceImprovement > 0 ? '+' : ''}{trends.paceImprovement.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Melhoria de Pace</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${trends.consistencyScore > 70 ? 'text-green-600' : trends.consistencyScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {trends.consistencyScore.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Consistência</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${Math.abs(trends.volumeProgression) < 10 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {trends.volumeProgression > 0 ? '+' : ''}{trends.volumeProgression.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Volume</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {trends.recommendations.map((rec: string, index: number) => (
                    <p key={index} className="text-sm text-gray-700">• {rec}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem Motivacional */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 text-center">
              <h4 className="font-semibold mb-2">💪 Mensagem do seu Coach</h4>
              <p className="text-lg">{analysis.motivationalMessage}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Erro ao gerar recomendação. Tente novamente.</p>
            <button
              onClick={generateRecommendation}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};