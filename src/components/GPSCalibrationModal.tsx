import React, { useState, useEffect } from 'react';
import { Navigation, CheckCircle, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { GPSTracker, GPSState } from '../utils/gpsTracking';

interface GPSCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrated: () => void;
  gpsTracker: GPSTracker;
}

export const GPSCalibrationModal: React.FC<GPSCalibrationModalProps> = ({
  isOpen,
  onClose,
  onCalibrated,
  gpsTracker
}) => {
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [gpsState, setGpsState] = useState<GPSState | null>(null);
  const [calibrationData, setCalibrationData] = useState({
    initialAccuracy: 0,
    finalAccuracy: 0,
    positionsCollected: 0,
    timeElapsed: 0
  });
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleStateChange = (state: GPSState) => {
      setGpsState(state);
      
      if (calibrationStep === 1 && state.isTracking) {
        setCalibrationData(prev => ({
          ...prev,
          positionsCollected: gpsTracker.getPositions().length,
          timeElapsed: startTime ? (Date.now() - startTime.getTime()) / 1000 : 0
        }));

        // Auto-avançar quando tiver precisão boa
        if (state.accuracy <= 10 && gpsTracker.getPositions().length >= 5) {
          setCalibrationData(prev => ({
            ...prev,
            finalAccuracy: state.accuracy
          }));
          setCalibrationStep(2);
        }
      }
    };

    gpsTracker.getState && setGpsState(gpsTracker.getState());
    
    // Simular listener (em implementação real, seria um callback)
    const interval = setInterval(() => {
      if (gpsTracker.getState) {
        handleStateChange(gpsTracker.getState());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, calibrationStep, gpsTracker, startTime]);

  const startCalibration = async () => {
    setCalibrationStep(1);
    setStartTime(new Date());
    
    const hasPermission = await gpsTracker.requestPermission();
    if (hasPermission) {
      gpsTracker.reset();
      gpsTracker.startTracking();
      
      if (gpsState) {
        setCalibrationData(prev => ({
          ...prev,
          initialAccuracy: gpsState.accuracy
        }));
      }
    } else {
      setCalibrationStep(0);
      alert('Permissão de GPS necessária para calibração');
    }
  };

  const finishCalibration = () => {
    gpsTracker.stopTracking();
    onCalibrated();
    onClose();
  };

  const restartCalibration = () => {
    gpsTracker.reset();
    setCalibrationStep(0);
    setCalibrationData({
      initialAccuracy: 0,
      finalAccuracy: 0,
      positionsCollected: 0,
      timeElapsed: 0
    });
    setStartTime(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Navigation className="w-6 h-6 mr-2 text-blue-600" />
            Calibração GPS
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {calibrationStep === 0 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Vamos calibrar seu GPS
            </h3>
            <p className="text-gray-600 mb-6">
              A calibração ajuda a melhorar a precisão do rastreamento durante seus treinos.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">📍 Para melhor calibração:</h4>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Vá para uma área aberta (sem prédios altos)</li>
                <li>• Mantenha o celular na posição vertical</li>
                <li>• Aguarde alguns minutos parado</li>
                <li>• Evite cobrir a parte superior do celular</li>
              </ul>
            </div>

            <button
              onClick={startCalibration}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Iniciar Calibração
            </button>
          </div>
        )}

        {calibrationStep === 1 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Navigation className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Calibrando GPS...
            </h3>
            <p className="text-gray-600 mb-6">
              Aguarde enquanto coletamos dados de localização precisos.
            </p>

            {gpsState && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Precisão atual:</span>
                    <div className={`font-bold ${gpsState.accuracy <= 10 ? 'text-green-600' : gpsState.accuracy <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                      ±{gpsState.accuracy.toFixed(1)}m
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Posições:</span>
                    <div className="font-bold text-blue-600">
                      {calibrationData.positionsCollected}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tempo:</span>
                    <div className="font-bold text-gray-800">
                      {calibrationData.timeElapsed.toFixed(0)}s
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Sinal:</span>
                    <div className={`font-bold ${
                      gpsState.signalStrength === 'excellent' ? 'text-green-600' :
                      gpsState.signalStrength === 'good' ? 'text-green-500' :
                      gpsState.signalStrength === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {gpsState.signalStrength}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={restartCalibration}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reiniciar</span>
              </button>
              {gpsState && gpsState.accuracy <= 15 && calibrationData.positionsCollected >= 3 && (
                <button
                  onClick={() => setCalibrationStep(2)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        )}

        {calibrationStep === 2 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Calibração Concluída!
            </h3>
            <p className="text-gray-600 mb-6">
              Seu GPS foi calibrado com sucesso e está pronto para rastrear seus treinos com precisão.
            </p>

            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-800 mb-3">Resultados da Calibração:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700">Precisão final:</span>
                  <div className="font-bold text-green-800">±{calibrationData.finalAccuracy.toFixed(1)}m</div>
                </div>
                <div>
                  <span className="text-green-700">Posições coletadas:</span>
                  <div className="font-bold text-green-800">{calibrationData.positionsCollected}</div>
                </div>
                <div>
                  <span className="text-green-700">Tempo total:</span>
                  <div className="font-bold text-green-800">{calibrationData.timeElapsed.toFixed(0)}s</div>
                </div>
                <div>
                  <span className="text-green-700">Status:</span>
                  <div className="font-bold text-green-800">
                    {calibrationData.finalAccuracy <= 5 ? 'Excelente' :
                     calibrationData.finalAccuracy <= 10 ? 'Muito Bom' :
                     calibrationData.finalAccuracy <= 15 ? 'Bom' : 'Regular'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={finishCalibration}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Finalizar e Começar Treino
            </button>
          </div>
        )}
      </div>
    </div>
  );
};