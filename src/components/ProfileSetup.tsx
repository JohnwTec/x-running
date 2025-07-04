import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { UserProfile } from '../types';
import { calculateIMC, classifyUser } from '../utils/calculations';

interface ProfileSetupProps {
  onProfileComplete: (profile: UserProfile) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileComplete }) => {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    age: 0,
    weight: 0,
    height: 0,
    level: null
  });
  
  const [formData, setFormData] = useState({
    distance: '',
    time: ''
  });

  const handleSubmit = () => {
    if (!profile.name || !profile.age || !profile.weight || !profile.height || !formData.distance || !formData.time) {
      return;
    }

    const level = classifyUser(parseFloat(formData.distance), parseFloat(formData.time));
    const completeProfile: UserProfile = {
      name: profile.name,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      level
    };

    onProfileComplete(completeProfile);
  };

  const isFormValid = profile.name && profile.age && profile.weight && profile.height && formData.distance && formData.time;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Configure seu Perfil</h2>
          <p className="text-gray-600">Vamos personalizar seus treinos</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Seu nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idade</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
              <input
                type="number"
                value={profile.weight || ''}
                onChange={(e) => setProfile({ ...profile, weight: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="70"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Altura (m)</label>
            <input
              type="number"
              step="0.01"
              value={profile.height || ''}
              onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="1.75"
            />
          </div>

          {profile.weight && profile.height && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">IMC:</span> {calculateIMC(profile.weight, profile.height)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distância média por treino (km)</label>
            <input
              type="number"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tempo para 5 km (minutos)</label>
            <input
              type="number"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="30"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
};