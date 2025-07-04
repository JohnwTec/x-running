import React, { useState, useEffect } from 'react';
import { Smartphone, Watch, Activity, Heart, Bluetooth, CheckCircle, X, Loader2, Instagram, Facebook } from 'lucide-react';
import { fitnessIntegration } from '../utils/fitnessIntegration';

interface FitnessConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FitnessConnectionModal: React.FC<FitnessConnectionModalProps> = ({ isOpen, onClose }) => {
  const [connections, setConnections] = useState({
    appleHealth: false,
    smartwatch: false,
    strava: false,
    amazfit: false,
    instagram: false,
    facebook: false
  });
  const [loading, setLoading] = useState({
    appleHealth: false,
    smartwatch: false,
    strava: false,
    amazfit: false,
    instagram: false,
    facebook: false
  });
  const [amazfitInfo, setAmazfitInfo] = useState<{ name: string; lastSync: Date | null } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConnections(fitnessIntegration.getConnectionStatus());
      setAmazfitInfo(fitnessIntegration.getAmazfitInfo());
    }
  }, [isOpen]);

  const handleConnect = async (service: keyof typeof connections) => {
    setLoading(prev => ({ ...prev, [service]: true }));
    
    try {
      let success = false;
      
      switch (service) {
        case 'appleHealth':
          success = await fitnessIntegration.requestAppleHealthPermission();
          if (success) localStorage.setItem('apple_health_connected', 'true');
          break;
        case 'smartwatch':
          success = await fitnessIntegration.connectSmartwatch();
          if (success) localStorage.setItem('smartwatch_connected', 'true');
          break;
        case 'strava':
          success = await fitnessIntegration.connectStrava();
          break;
        case 'amazfit':
          success = await fitnessIntegration.connectAmazfit();
          if (success) {
            setAmazfitInfo(fitnessIntegration.getAmazfitInfo());
            // Tentar sincronizar com o app Zepp
            await fitnessIntegration.syncWithZeppApp();
          }
          break;
        case 'instagram':
          // Simular conexão com Instagram
          success = true;
          localStorage.setItem('running_trainer_instagram_connected', 'true');
          break;
        case 'facebook':
          // Simular conexão com Facebook
          success = true;
          localStorage.setItem('running_trainer_facebook_connected', 'true');
          break;
      }
      
      if (success) {
        setConnections(prev => ({ ...prev, [service]: true }));
      }
    } catch (error) {
      console.error(`Erro ao conectar ${service}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [service]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Conectar Dispositivos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Apple Health */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Apple Health</h3>
                  <p className="text-sm text-gray-600">Sincronizar dados de saúde</p>
                </div>
              </div>
              {connections.appleHealth ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <button
                  onClick={() => handleConnect('appleHealth')}
                  disabled={loading.appleHealth}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loading.appleHealth ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Conectar</span>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              • Frequência cardíaca • Passos • Calorias • Distância
            </div>
          </div>

          {/* Smartwatch */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Watch className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Smartwatch</h3>
                  <p className="text-sm text-gray-600">Apple Watch, Galaxy Watch, etc.</p>
                </div>
              </div>
              {connections.smartwatch ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <button
                  onClick={() => handleConnect('smartwatch')}
                  disabled={loading.smartwatch}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loading.smartwatch ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              • Monitoramento em tempo real • Frequência cardíaca • GPS
            </div>
          </div>

          {/* Amazfit/Zepp */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Amazfit/Zepp</h3>
                  <p className="text-sm text-gray-600">
                    {amazfitInfo ? amazfitInfo.name : 'Dispositivos Amazfit'}
                  </p>
                </div>
              </div>
              {connections.amazfit ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <button
                  onClick={() => handleConnect('amazfit')}
                  disabled={loading.amazfit}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loading.amazfit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4" />
                      <span>Conectar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              • GTR, GTS, T-Rex, Bip, Mi Band • Sincronização com Zepp App
            </div>
            {amazfitInfo && amazfitInfo.lastSync && (
              <div className="text-xs text-green-600 mt-2">
                Última sincronização: {amazfitInfo.lastSync.toLocaleString('pt-BR')}
              </div>
            )}
          </div>

          {/* Strava */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Strava</h3>
                  <p className="text-sm text-gray-600">Compartilhar treinos</p>
                </div>
              </div>
              {connections.strava ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <button
                  onClick={() => handleConnect('strava')}
                  disabled={loading.strava}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loading.strava ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Conectar</span>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              • Upload automático • Compartilhamento social • Análises
            </div>
          </div>

          {/* Instagram */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mr-3">
                  <Instagram className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Instagram</h3>
                  <p className="text-sm text-gray-600">Compartilhar conquistas</p>
                </div>
              </div>
              {connections.instagram ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <button
                  onClick={() => handleConnect('instagram')}
                  disabled={loading.instagram}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-400 disabled:to-pink-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loading.instagram ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Conectar</span>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              • Stories automáticos • Posts de treinos • Hashtags inteligentes
            </div>
          </div>

          {/* Facebook */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Facebook className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Facebook</h3>
                  <p className="text-sm text-gray-600">Compartilhar progressos</p>
                </div>
              </div>
              {connections.facebook ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <button
                  onClick={() => handleConnect('facebook')}
                  disabled={loading.facebook}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {loading.facebook ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Conectar</span>
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500">
              • Posts automáticos • Grupos de corrida • Desafios com amigos
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">🔒 Privacidade e Segurança</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Seus dados são criptografados e protegidos</li>
            <li>• Você controla quais dados compartilhar</li>
            <li>• Pode desconectar a qualquer momento</li>
            <li>• Compartilhamento social é sempre opcional</li>
          </ul>
        </div>

        <div className="mt-4 bg-yellow-50 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 Benefícios das Conexões</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Monitoramento mais preciso da frequência cardíaca</li>
            <li>• Sincronização automática de dados</li>
            <li>• Análises mais detalhadas dos treinos</li>
            <li>• Motivação através do compartilhamento social</li>
            <li>• Backup automático em múltiplas plataformas</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};