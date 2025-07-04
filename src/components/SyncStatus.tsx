import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncStatusProps {
  isOnline: boolean;
  lastSync: Date | null;
  userEmail: string | null;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ isOnline, lastSync, userEmail }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days} dias atrás`;
  };

  const getSyncStatus = () => {
    if (!userEmail) return { icon: CloudOff, color: 'text-gray-500', text: 'Não logado' };
    if (!isOnline) return { icon: WifiOff, color: 'text-red-500', text: 'Offline' };
    if (lastSync && (new Date().getTime() - lastSync.getTime()) < 60000) {
      return { icon: CheckCircle, color: 'text-green-500', text: 'Sincronizado' };
    }
    return { icon: AlertCircle, color: 'text-yellow-500', text: 'Pendente' };
  };

  const status = getSyncStatus();
  const StatusIcon = status.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-2 bg-white rounded-lg shadow-md px-3 py-2 hover:shadow-lg transition-all"
      >
        <StatusIcon className={`w-4 h-4 ${status.color}`} />
        <span className="text-sm font-medium text-gray-700">{status.text}</span>
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border p-4 w-64 z-50">
          <h3 className="font-semibold text-gray-800 mb-3">Status da Sincronização</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Usuário:</span>
              <span className="text-sm font-medium text-gray-800">
                {userEmail ? userEmail.split('@')[0] : 'Não logado'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexão:</span>
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Última sync:</span>
              <span className="text-sm font-medium text-gray-800">
                {formatLastSync(lastSync)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>💡 Dica:</strong> Seus dados são salvos localmente e sincronizados automaticamente quando online.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};