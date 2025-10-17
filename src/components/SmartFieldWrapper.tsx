import React, { useEffect, useRef } from 'react';
import { HelpCircle, Zap } from 'lucide-react';

interface SmartFieldWrapperProps {
  fieldId: string;
  label: string;
  isActive: boolean;
  isComplete: boolean;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  onFocus?: () => void;
}

const SmartFieldWrapper: React.FC<SmartFieldWrapperProps> = ({
  fieldId,
  label,
  isActive,
  isComplete,
  tooltip,
  children,
  className = '',
  onFocus,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  useEffect(() => {
    if (isActive && wrapperRef.current) {
      wrapperRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div
      ref={wrapperRef}
      className={`relative transition-all duration-300 ${className}`}
      onFocus={onFocus}
    >
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={fieldId}
          className={`text-sm font-medium transition-colors ${
            isActive
              ? 'text-blue-700'
              : isComplete
              ? 'text-green-700'
              : 'text-gray-700'
          }`}
        >
          {label}
          {isActive && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              Şimdi
            </span>
          )}
          {isComplete && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              ✓ Tamamlandı
            </span>
          )}
        </label>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              aria-label="Yardım"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-6 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg animate-fade-in">
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={`relative rounded-lg transition-all duration-300 ${
          isActive
            ? 'ring-4 ring-blue-200 ring-opacity-50 shadow-lg'
            : isComplete
            ? 'ring-2 ring-green-200'
            : ''
        }`}
      >
        {children}

        {isActive && (
          <>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg opacity-20 animate-pulse pointer-events-none" />
            <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
              <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse" />
            </div>
          </>
        )}

        {isComplete && (
          <div className="absolute -right-2 -top-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
            ✓
          </div>
        )}
      </div>

      {isActive && tooltip && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 animate-fade-in">
          💡 {tooltip}
        </div>
      )}
    </div>
  );
};

export default SmartFieldWrapper;
