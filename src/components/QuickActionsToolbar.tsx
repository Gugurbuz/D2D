import React, { useState } from 'react';
import {
  Maximize2,
  Trash2,
  Send,
  Save,
  Phone,
  X,
  ChevronUp,
  Keyboard,
  RotateCcw,
} from 'lucide-react';
import { BRAND_COLORS } from '../styles/theme';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  shortcut?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface QuickActionsToolbarProps {
  actions: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  actions,
  position = 'bottom-right',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'secondary':
      default:
        return 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';
    }
  };

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        actions.forEach((action) => {
          if (action.shortcut === e.key && !action.disabled) {
            e.preventDefault();
            action.onClick();
          }
        });
      }

      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [actions]);

  return (
    <>
      <div className={`fixed ${getPositionClasses()} z-40 ${className}`}>
        <div className="flex flex-col-reverse items-end gap-2">
          {isExpanded && (
            <div className="flex flex-col gap-2 animate-slide-up">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    setIsExpanded(false);
                  }}
                  disabled={action.disabled}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${getVariantClasses(
                    action.variant
                  )}`}
                  title={action.shortcut ? `Kısayol: Ctrl+${action.shortcut}` : action.label}
                >
                  {action.icon}
                  <span className="font-medium whitespace-nowrap">{action.label}</span>
                  {action.shortcut && (
                    <kbd className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-300">
                      ⌘{action.shortcut}
                    </kbd>
                  )}
                </button>
              ))}

              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow-lg transition-all"
                title="Klavye Kısayolları (Ctrl+K)"
              >
                <Keyboard className="w-4 h-4" />
                <span className="text-sm">Kısayollar</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
            style={{ backgroundColor: BRAND_COLORS.navy }}
            aria-label={isExpanded ? 'Hızlı İşlemleri Kapat' : 'Hızlı İşlemleri Aç'}
          >
            {isExpanded ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <ChevronUp className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Klavye Kısayolları
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {actions
                .filter((action) => action.shortcut)
                .map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <span className="text-sm text-gray-700">{action.label}</span>
                    </div>
                    <kbd className="px-3 py-1 text-sm bg-white text-gray-700 rounded border border-gray-300 font-mono">
                      Ctrl + {action.shortcut.toUpperCase()}
                    </kbd>
                  </div>
                ))}

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Bu Menüyü Aç/Kapat</span>
                </div>
                <kbd className="px-3 py-1 text-sm bg-white text-gray-700 rounded border border-gray-300 font-mono">
                  Ctrl + K
                </kbd>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <p className="font-medium">💡 İpucu:</p>
              <p className="mt-1">
                Mac kullanıyorsanız, Ctrl yerine ⌘ (Command) tuşunu kullanın.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const defaultContractActions = (callbacks: {
  onPreviewContract: () => void;
  onClearSignature: () => void;
  onResendSMS: () => void;
  onSaveAndExit: () => void;
  onCallSupport: () => void;
}): QuickAction[] => [
  {
    id: 'preview',
    label: 'Sözleşme Önizle',
    icon: <Maximize2 className="w-5 h-5" />,
    onClick: callbacks.onPreviewContract,
    shortcut: 'p',
    variant: 'secondary',
  },
  {
    id: 'clear-signature',
    label: 'İmzayı Temizle',
    icon: <Trash2 className="w-5 h-5" />,
    onClick: callbacks.onClearSignature,
    shortcut: 'd',
    variant: 'danger',
  },
  {
    id: 'resend-sms',
    label: 'SMS Tekrar Gönder',
    icon: <Send className="w-5 h-5" />,
    onClick: callbacks.onResendSMS,
    shortcut: 's',
    variant: 'secondary',
  },
  {
    id: 'save-exit',
    label: 'Kaydet ve Çık',
    icon: <Save className="w-5 h-5" />,
    onClick: callbacks.onSaveAndExit,
    shortcut: 'q',
    variant: 'primary',
  },
  {
    id: 'call-support',
    label: 'Destek Ara',
    icon: <Phone className="w-5 h-5" />,
    onClick: callbacks.onCallSupport,
    shortcut: 'h',
    variant: 'secondary',
  },
];

export default QuickActionsToolbar;
