import React from 'react';
import { Zap, ArrowLeft } from 'lucide-react';

interface IntervalSelectionProps {
  onIntervalSelect: (distance: string) => void;
  onBack: () => void;
}

export const IntervalSelection: React.FC<IntervalSelectionProps> = ({ onIntervalSelect, onBack }) => {
  const intervals = [
    { distance: '100m', description: 'Velocidade máxima' },
    { distance: '400m', description: 'Potência anaeróbica' },
    { distance: '600m', description: 'VO₂ máximo' },
    { distance: '800m', description: 'Limiar anaeróbico' },
    { distance: '1km', description: 'Resistência de velocidade' },
    { distance: '30s15s', description: 'Intervalos curtos' },
    { distance: '4x4', description: 'Intervalos longos' },
    { distance: '10-20-30', description: 'Progressivo' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Escolha a Distância</h2>
          <p className="text-gray-600">Selecione o tipo de intervalado</p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {intervals.map((interval) => (
            <button
              key={interval.distance}
              onClick={() => onIntervalSelect(interval.distance)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-between shadow-md"
            >
              <div className="text-left">
                <div className="font-bold">{interval.distance}</div>
                <div className="text-sm opacity-90">{interval.description}</div>
              </div>
              <Zap className="w-5 h-5" />
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
      </div>
    </div>
  );
};