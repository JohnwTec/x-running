import React from 'react';
import { TrendingUp, Clock, Zap, X } from 'lucide-react';

interface AdaptiveTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  suggestion: {
    newPace?: number;
    newRestTime?: number;
    message: string;
  };
  trainingType: 'longa' | 'intervalado';
}

export const AdaptiveTrainingModal: React.FC<AdaptiveTrainingModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  suggestion,
  trainingType
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Progressão Detectada!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{suggestion.message}</p>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Novos Parâmetros Sugeridos:</h3>
            
            {suggestion.newPace && (
              <div className="flex items-center mb-2">
                <Zap className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-700">
                  Novo pace: <span className="font-bold text-blue-600">{suggestion.newPace.toFixed(1)} min/km</span>
                </span>
              </div>
            )}
            
            {suggestion.newRestTime && (
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-gray-700">
                  Novo descanso: <span className="font-bold text-purple-600">{suggestion.newRestTime}s</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-800">
            💡 <strong>Dica:</strong> Você pode sempre voltar aos parâmetros anteriores se sentir que está muito difícil.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Manter Atual
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            Aceitar Desafio!
          </button>
        </div>
      </div>
    </div>
  );
};