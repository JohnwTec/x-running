import React, { useState, useEffect } from 'react';
import { Heart, Scale, Activity, Moon, Zap, TrendingUp, X, Save } from 'lucide-react';
import { database } from '../lib/database';

interface HealthMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthMetricsModal: React.FC<HealthMetricsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    body_fat_percentage: '',
    muscle_mass: '',
    resting_heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    sleep_hours: '',
    sleep_quality: 5,
    stress_level: 5,
    energy_level: 5,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [recentMetrics, setRecentMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadRecentMetrics();
    }
  }, [isOpen]);

  const loadRecentMetrics = async () => {
    try {
      const data = await database.getHealthMetrics(7);
      setRecentMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const metricsToSave = {
        date: metrics.date,
        weight: metrics.weight ? parseFloat(metrics.weight) : undefined,
        body_fat_percentage: metrics.body_fat_percentage ? parseFloat(metrics.body_fat_percentage) : undefined,
        muscle_mass: metrics.muscle_mass ? parseFloat(metrics.muscle_mass) : undefined,
        resting_heart_rate: metrics.resting_heart_rate ? parseInt(metrics.resting_heart_rate) : undefined,
        blood_pressure_systolic: metrics.blood_pressure_systolic ? parseInt(metrics.blood_pressure_systolic) : undefined,
        blood_pressure_diastolic: metrics.blood_pressure_diastolic ? parseInt(metrics.blood_pressure_diastolic) : undefined,
        sleep_hours: metrics.sleep_hours ? parseFloat(metrics.sleep_hours) : undefined,
        sleep_quality: metrics.sleep_quality,
        stress_level: metrics.stress_level,
        energy_level: metrics.energy_level,
        notes: metrics.notes || undefined
      };

      const success = await database.saveHealthMetrics(metricsToSave);
      if (success) {
        onClose();
        loadRecentMetrics();
      }
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Heart className="w-6 h-6 mr-2 text-red-600" />
            Métricas de Saúde
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulário de entrada */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar Hoje</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
              <input
                type="date"
                value={metrics.date}
                onChange={(e) => setMetrics({ ...metrics, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={metrics.weight}
                  onChange={(e) => setMetrics({ ...metrics, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="70.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">% Gordura</label>
                <input
                  type="number"
                  step="0.1"
                  value={metrics.body_fat_percentage}
                  onChange={(e) => setMetrics({ ...metrics, body_fat_percentage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">FC Repouso</label>
                <input
                  type="number"
                  value={metrics.resting_heart_rate}
                  onChange={(e) => setMetrics({ ...metrics, resting_heart_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sono (horas)</label>
                <input
                  type="number"
                  step="0.5"
                  value={metrics.sleep_hours}
                  onChange={(e) => setMetrics({ ...metrics, sleep_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PA Sistólica</label>
                <input
                  type="number"
                  value={metrics.blood_pressure_systolic}
                  onChange={(e) => setMetrics({ ...metrics, blood_pressure_systolic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PA Diastólica</label>
                <input
                  type="number"
                  value={metrics.blood_pressure_diastolic}
                  onChange={(e) => setMetrics({ ...metrics, blood_pressure_diastolic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="80"
                />
              </div>
            </div>

            {/* Escalas de 1-10 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualidade do Sono: {metrics.sleep_quality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={metrics.sleep_quality}
                  onChange={(e) => setMetrics({ ...metrics, sleep_quality: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Péssimo</span>
                  <span>Excelente</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Estresse: {metrics.stress_level}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={metrics.stress_level}
                  onChange={(e) => setMetrics({ ...metrics, stress_level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Muito baixo</span>
                  <span>Muito alto</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Energia: {metrics.energy_level}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={metrics.energy_level}
                  onChange={(e) => setMetrics({ ...metrics, energy_level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Muito baixo</span>
                  <span>Muito alto</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
              <textarea
                value={metrics.notes}
                onChange={(e) => setMetrics({ ...metrics, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Como você se sente hoje?"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Salvando...' : 'Salvar Métricas'}</span>
            </button>
          </div>

          {/* Histórico recente */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Últimos 7 dias
            </h3>
            
            {recentMetrics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma métrica registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMetrics.map((metric, index) => (
                  <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">
                        {new Date(metric.date).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {index === 0 ? 'Hoje' : `${index} dia${index > 1 ? 's' : ''} atrás`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {metric.weight && (
                        <div className="flex items-center">
                          <Scale className="w-4 h-4 mr-1 text-blue-600" />
                          <span>{metric.weight} kg</span>
                        </div>
                      )}
                      {metric.resting_heart_rate && (
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1 text-red-600" />
                          <span>{metric.resting_heart_rate} bpm</span>
                        </div>
                      )}
                      {metric.sleep_hours && (
                        <div className="flex items-center">
                          <Moon className="w-4 h-4 mr-1 text-purple-600" />
                          <span>{metric.sleep_hours}h sono</span>
                        </div>
                      )}
                      {metric.energy_level && (
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-1 text-yellow-600" />
                          <span>Energia {metric.energy_level}/10</span>
                        </div>
                      )}
                    </div>
                    
                    {metric.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{metric.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Dicas para melhor acompanhamento:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Registre suas métricas sempre no mesmo horário</li>
            <li>• Use uma balança de bioimpedância para % de gordura</li>
            <li>• Meça a pressão arterial em repouso</li>
            <li>• Monitore como o treino afeta seu sono e energia</li>
            <li>• Anote fatores que podem influenciar suas métricas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};