import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Download, RotateCcw } from 'lucide-react';
import { GPSTracker, GPSState } from '../utils/gpsTracking';

interface GPSDebugPanelProps {
  gpsTracker: GPSTracker;
  gpsState: GPSState;
}

export const GPSDebugPanel: React.FC<GPSDebugPanelProps> = ({ 
  gpsTracker, 
  gpsState 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const stats = gpsTracker.getGPSStats();
  const positions = gpsTracker.getPositions();
  const rawPositions = gpsTracker.getRawPositions();

  const handleExportData = () => {
    const data = gpsTracker.exportTrackingData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-tracking-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetGPS = () => {
    if (confirm('Resetar dados de GPS? Isso irá limpar todas as posições registradas.')) {
      gpsTracker.reset();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 w-80 max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Debug GPS</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <EyeOff className="w-5 h-5" />
        </button>
      </div>

      {/* Status Geral */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 font-medium ${gpsState.isTracking ? 'text-green-600' : 'text-red-600'}`}>
              {gpsState.isTracking ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Sinal:</span>
            <span className="ml-2 font-medium">{gpsState.signalStrength}</span>
          </div>
          <div>
            <span className="text-gray-600">Precisão:</span>
            <span className="ml-2 font-medium">{gpsState.accuracy.toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-gray-600">Velocidade:</span>
            <span className="ml-2 font-medium">
              {gpsState.speed ? `${(gpsState.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Estatísticas</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Posições válidas:</span>
            <span className="font-medium">{stats.validPositions}</span>
          </div>
          <div className="flex justify-between">
            <span>Posições filtradas:</span>
            <span className="font-medium">{stats.filteredPositions}</span>
          </div>
          <div className="flex justify-between">
            <span>Precisão média:</span>
            <span className="font-medium">{stats.averageAccuracy.toFixed(1)}m</span>
          </div>
          <div className="flex justify-between">
            <span>Velocidade máx:</span>
            <span className="font-medium">{(stats.maxSpeed * 3.6).toFixed(1)} km/h</span>
          </div>
          <div className="flex justify-between">
            <span>Ganho elevação:</span>
            <span className="font-medium">{stats.totalElevationGain.toFixed(1)}m</span>
          </div>
          <div className="flex justify-between">
            <span>Distância total:</span>
            <span className="font-medium">{gpsState.totalDistance.toFixed(3)} km</span>
          </div>
        </div>
      </div>

      {/* Dados Brutos */}
      <div className="mb-4">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Eye className="w-4 h-4" />
          <span>{showRawData ? 'Ocultar' : 'Mostrar'} dados brutos</span>
        </button>
        
        {showRawData && (
          <div className="mt-2 bg-gray-50 rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
            <div className="mb-2">
              <strong>Última posição válida:</strong>
              {positions.length > 0 && (
                <div>
                  Lat: {positions[positions.length - 1].coords.latitude.toFixed(6)}<br/>
                  Lon: {positions[positions.length - 1].coords.longitude.toFixed(6)}<br/>
                  Acc: {positions[positions.length - 1].coords.accuracy.toFixed(1)}m
                </div>
              )}
            </div>
            <div>
              <strong>Última posição bruta:</strong>
              {rawPositions.length > 0 && (
                <div>
                  Lat: {rawPositions[rawPositions.length - 1].coords.latitude.toFixed(6)}<br/>
                  Lon: {rawPositions[rawPositions.length - 1].coords.longitude.toFixed(6)}<br/>
                  Acc: {rawPositions[rawPositions.length - 1].coords.accuracy.toFixed(1)}m
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex space-x-2">
        <button
          onClick={handleExportData}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded flex items-center justify-center space-x-1"
        >
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </button>
        <button
          onClick={handleResetGPS}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded flex items-center justify-center space-x-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Dicas */}
      <div className="mt-4 bg-blue-50 rounded-lg p-3">
        <h4 className="font-medium text-blue-800 mb-2">💡 Dicas para melhor GPS:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Mantenha o celular desbloqueado durante o treino</li>
          <li>• Evite cobrir a antena GPS (parte superior do celular)</li>
          <li>• Aguarde alguns segundos ao ar livre antes de iniciar</li>
          <li>• Evite áreas com muitos prédios altos</li>
          <li>• Certifique-se que o GPS está ativado nas configurações</li>
        </ul>
      </div>
    </div>
  );
};