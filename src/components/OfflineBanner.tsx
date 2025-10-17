import React from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { ConnectionStatus } from '../hooks/useOfflineSync';

interface OfflineBannerProps {
  connectionStatus: ConnectionStatus;
  queueCount: number;
  isSyncing: boolean;
  syncProgress?: { current: number; total: number };
  onManualSync?: () => void;
  className?: string;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({
  connectionStatus,
  queueCount,
  isSyncing,
  syncProgress,
  onManualSync,
  className = '',
}) => {
  if (connectionStatus === 'online' && queueCount === 0) {
    return null;
  }

  const renderContent = () => {
    if (connectionStatus === 'offline') {
      return (
        <div className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Çevrimdışı Mod</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                İnternet bağlantısı yok. Değişiklikler yerel olarak kaydediliyor.
                {queueCount > 0 && ` (${queueCount} işlem bekliyor)`}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (connectionStatus === 'reconnecting') {
      return (
        <div className="flex items-center justify-between bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Yeniden Bağlanılıyor...</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Bağlantı kuruluyor, lütfen bekleyin.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isSyncing && syncProgress) {
      const percentage = Math.round((syncProgress.current / syncProgress.total) * 100);
      return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Senkronize Ediliyor...
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  {syncProgress.current} / {syncProgress.total} işlem
                </p>
              </div>
            </div>
            <span className="text-sm font-bold text-blue-700">{percentage}%</span>
          </div>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    }

    if (queueCount > 0) {
      return (
        <div className="flex items-center justify-between bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                Senkronize Edilmemiş İşlemler
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                {queueCount} işlem senkronize edilmeyi bekliyor.
              </p>
            </div>
          </div>
          {onManualSync && !isSyncing && (
            <button
              onClick={onManualSync}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Şimdi Senkronize Et
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 bg-green-50 border-l-4 border-green-400 p-4">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Çevrimiçi ve Senkronize</p>
          <p className="text-xs text-green-700 mt-0.5">
            Tüm değişiklikler kaydedildi.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`animate-slide-down ${className}`}>
      {renderContent()}
    </div>
  );
};

export default OfflineBanner;
