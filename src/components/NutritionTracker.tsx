import React, { useState, useEffect } from 'react';
import { Apple, Plus, Trash2, Coffee, Utensils, Moon, Zap, X, Save } from 'lucide-react';
import { database } from '../lib/database';

interface NutritionTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NutritionEntry {
  id?: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  food_item: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  water_ml?: number;
  notes?: string;
}

export const NutritionTracker: React.FC<NutritionTrackerProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [newEntry, setNewEntry] = useState<NutritionEntry>({
    meal_type: 'breakfast',
    food_item: '',
    calories: undefined,
    carbs: undefined,
    protein: undefined,
    fat: undefined,
    water_ml: undefined,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNutritionData();
    }
  }, [isOpen, selectedDate]);

  const loadNutritionData = async () => {
    try {
      const data = await database.getNutritionLogs(selectedDate);
      setEntries(data);
    } catch (error) {
      console.error('Erro ao carregar dados nutricionais:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.food_item.trim()) return;

    setLoading(true);
    try {
      const success = await database.saveNutritionLog({
        date: selectedDate,
        ...newEntry
      });

      if (success) {
        setNewEntry({
          meal_type: 'breakfast',
          food_item: '',
          calories: undefined,
          carbs: undefined,
          protein: undefined,
          fat: undefined,
          water_ml: undefined,
          notes: ''
        });
        loadNutritionData();
      }
    } catch (error) {
      console.error('Erro ao salvar entrada nutricional:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <Coffee className="w-5 h-5 text-orange-600" />;
      case 'lunch': return <Utensils className="w-5 h-5 text-green-600" />;
      case 'dinner': return <Moon className="w-5 h-5 text-purple-600" />;
      case 'snack': return <Apple className="w-5 h-5 text-red-600" />;
      case 'pre_workout': return <Zap className="w-5 h-5 text-blue-600" />;
      case 'post_workout': return <Zap className="w-5 h-5 text-yellow-600" />;
      default: return <Utensils className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMealLabel = (mealType: string) => {
    const labels = {
      breakfast: 'Café da Manhã',
      lunch: 'Almoço',
      dinner: 'Jantar',
      snack: 'Lanche',
      pre_workout: 'Pré-Treino',
      post_workout: 'Pós-Treino'
    };
    return labels[mealType as keyof typeof labels] || mealType;
  };

  const calculateTotals = () => {
    return entries.reduce((totals, entry) => ({
      calories: totals.calories + (entry.calories || 0),
      carbs: totals.carbs + (entry.carbs || 0),
      protein: totals.protein + (entry.protein || 0),
      fat: totals.fat + (entry.fat || 0),
      water: totals.water + (entry.water_ml || 0)
    }), { calories: 0, carbs: 0, protein: 0, fat: 0, water: 0 });
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Apple className="w-6 h-6 mr-2 text-green-600" />
            Diário Nutricional
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de entrada */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Alimento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refeição</label>
                <select
                  value={newEntry.meal_type}
                  onChange={(e) => setNewEntry({ ...newEntry, meal_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="breakfast">Café da Manhã</option>
                  <option value="lunch">Almoço</option>
                  <option value="dinner">Jantar</option>
                  <option value="snack">Lanche</option>
                  <option value="pre_workout">Pré-Treino</option>
                  <option value="post_workout">Pós-Treino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alimento</label>
                <input
                  type="text"
                  value={newEntry.food_item}
                  onChange={(e) => setNewEntry({ ...newEntry, food_item: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Banana média, Aveia 50g..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calorias</label>
                  <input
                    type="number"
                    value={newEntry.calories || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="kcal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Água (ml)</label>
                  <input
                    type="number"
                    value={newEntry.water_ml || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, water_ml: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ml"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.carbs || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, carbs: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proteína (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.protein || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, protein: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gordura (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.fat || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, fat: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="g"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="Observações opcionais..."
                />
              </div>

              <button
                onClick={handleAddEntry}
                disabled={loading || !newEntry.food_item.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>{loading ? 'Adicionando...' : 'Adicionar'}</span>
              </button>
            </div>
          </div>

          {/* Lista de entradas e resumo */}
          <div className="lg:col-span-2">
            {/* Resumo do dia */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Resumo do dia - {new Date(selectedDate).toLocaleDateString('pt-BR')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{totals.calories}</p>
                  <p className="text-sm text-gray-600">Calorias</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{totals.carbs.toFixed(1)}g</p>
                  <p className="text-sm text-gray-600">Carboidratos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{totals.protein.toFixed(1)}g</p>
                  <p className="text-sm text-gray-600">Proteína</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{totals.fat.toFixed(1)}g</p>
                  <p className="text-sm text-gray-600">Gordura</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-600">{totals.water}ml</p>
                  <p className="text-sm text-gray-600">Água</p>
                </div>
              </div>
            </div>

            {/* Lista de entradas */}
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alimentos do Dia</h3>
            
            {entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Apple className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum alimento registrado para este dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div key={entry.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getMealIcon(entry.meal_type)}
                        <span className="font-medium text-gray-800">{getMealLabel(entry.meal_type)}</span>
                      </div>
                      <button className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h4 className="font-semibold text-gray-800 mb-2">{entry.food_item}</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      {entry.calories && (
                        <div>
                          <span className="text-gray-600">Calorias:</span>
                          <span className="font-medium ml-1">{entry.calories}</span>
                        </div>
                      )}
                      {entry.carbs && (
                        <div>
                          <span className="text-gray-600">Carbs:</span>
                          <span className="font-medium ml-1">{entry.carbs}g</span>
                        </div>
                      )}
                      {entry.protein && (
                        <div>
                          <span className="text-gray-600">Proteína:</span>
                          <span className="font-medium ml-1">{entry.protein}g</span>
                        </div>
                      )}
                      {entry.fat && (
                        <div>
                          <span className="text-gray-600">Gordura:</span>
                          <span className="font-medium ml-1">{entry.fat}g</span>
                        </div>
                      )}
                      {entry.water_ml && (
                        <div>
                          <span className="text-gray-600">Água:</span>
                          <span className="font-medium ml-1">{entry.water_ml}ml</span>
                        </div>
                      )}
                    </div>
                    
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{entry.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">🥗 Dicas nutricionais para corredores:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Hidrate-se bem: 35ml por kg de peso corporal + 500-750ml por hora de treino</li>
            <li>• Carboidratos: 3-12g/kg de peso (dependendo da intensidade do treino)</li>
            <li>• Proteínas: 1.2-2.0g/kg de peso para recuperação muscular</li>
            <li>• Refeição pré-treino: 1-4h antes, rica em carboidratos, baixa em fibras</li>
            <li>• Refeição pós-treino: até 2h após, carboidratos + proteínas (3:1 ou 4:1)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};