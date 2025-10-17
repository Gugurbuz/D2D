import React from 'react';
import { Cloud, CloudOff, Check, Loader2, AlertCircle } from 'lucide-react';
import { SaveStatus } from '../hooks/useContractAutoSave';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSavedAt,
  error,
  onRetry,
  className = '',
}) => {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 10) return 'Az önce';
    if (seconds < 60) return `${seconds} saniye önce`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dakika önce`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Kaydediliyor...</span>
          </div>
        );

      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">
              Kaydedildi {lastSavedAt && `• ${formatLastSaved(lastSavedAt)}`}
            </span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-red-600">
              <CloudOff className="w-4 h-4" />
              <span className="text-sm font-medium">Kayıt başarısız</span>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-red-600 hover:text-red-700 underline"
              >
                Tekrar dene
              </button>
            )}
          </div>
        );

      case 'idle':
      default:
        if (lastSavedAt) {
          return (
            <div className="flex items-center gap-2 text-gray-500">
              <Cloud className="w-4 h-4" />
              <span className="text-sm">
                Son kayıt: {formatLastSaved(lastSavedAt)}
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <Cloud className="w-4 h-4" />
            <span className="text-sm">Otomatik kayıt aktif</span>
          </div>
        );
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {renderContent()}
      {error && status === 'error' && (
        <div className="ml-2 group relative">
          <AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 w-64 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 shadow-lg">
            {error.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSaveIndicator;
