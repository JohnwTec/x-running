import React from 'react';
import { MapPin, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { GPSState } from '../utils/gpsTracking';

interface GPSStatusIndicatorProps {
  gpsState: GPSState;
  className?: string;
}

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({ 
  gpsState, 
  className = '' 
}) => {
  const getStatusIcon = () => {
    if (!gpsState.isGPSEnabled) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (!gpsState.isTracking) {
      return <MapPin className="w-4 h-4 text-gray-400" />;
    }

    switch (gpsState.signalStrength) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'good':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'fair':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!gpsState.isGPSEnabled) {
      return 'GPS Desabilitado';
    }
    
    if (!gpsState.isTracking) {
      return 'GPS Inativo';
    }

    const accuracy = gpsState.accuracy;
    
    switch (gpsState.signalStrength) {
      case 'excellent':
        return `Excelente (±${accuracy.toFixed(0)}m)`;
      case 'good':
        return `Bom (±${accuracy.toFixed(0)}m)`;
      case 'fair':
        return `Regular (±${accuracy.toFixed(0)}m)`;
      case 'poor':
        return `Fraco (±${accuracy.toFixed(0)}m)`;
      default:
        return 'Conectando...';
    }
  };

  const getStatusColor = () => {
    if (!gpsState.isGPSEnabled || !gpsState.isTracking) {
      return 'text-gray-500 bg-gray-50';
    }

    switch (gpsState.signalStrength) {
      case 'excellent':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'fair':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className="text-xs font-medium">GPS</span>
        <span className="text-xs">{getStatusText()}</span>
      </div>
      {gpsState.isTracking && gpsState.lastUpdate && (
        <div className="text-xs opacity-75">
          {Math.round((Date.now() - gpsState.lastUpdate.getTime()) / 1000)}s
        </div>
      )}
    </div>
  );
};