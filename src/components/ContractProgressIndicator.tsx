import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { BRAND_COLORS } from '../styles/theme';

export interface ContractProgress {
  contractAccepted: boolean;
  signatureCaptured: boolean;
  smsSent: boolean;
  otpVerified: boolean;
}

interface ContractProgressIndicatorProps {
  progress: ContractProgress;
  className?: string;
}

interface RequirementItem {
  id: keyof ContractProgress;
  label: string;
  description: string;
  completed: boolean;
}

const ContractProgressIndicator: React.FC<ContractProgressIndicatorProps> = ({
  progress,
  className = '',
}) => {
  const requirements: RequirementItem[] = [
    {
      id: 'contractAccepted',
      label: 'Sözleşme Onayı',
      description: 'Sözleşme koşullarını okuyup onaylayın',
      completed: progress.contractAccepted,
    },
    {
      id: 'signatureCaptured',
      label: 'Dijital İmza',
      description: 'Müşterinin imzasını alın',
      completed: progress.signatureCaptured,
    },
    {
      id: 'smsSent',
      label: 'SMS Gönderimi',
      description: 'Onay SMS\'i gönderin',
      completed: progress.smsSent,
    },
    {
      id: 'otpVerified',
      label: 'SMS Doğrulama',
      description: 'SMS kodunu doğrulayın',
      completed: progress.otpVerified,
    },
  ];

  const completedCount = requirements.filter((r) => r.completed).length;
  const totalCount = requirements.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getStatusIcon = (completed: boolean, isBlocked: boolean = false) => {
    if (completed) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (isBlocked) {
      return <AlertCircle className="w-5 h-5 text-gray-300" />;
    }
    return <Circle className="w-5 h-5 text-yellow-500" />;
  };

  const getNextAction = (): string => {
    if (!progress.contractAccepted) {
      return 'Sözleşmeyi okuyup onaylayın';
    }
    if (!progress.signatureCaptured) {
      return 'Müşterinin imzasını alın';
    }
    if (!progress.smsSent) {
      return 'SMS onay kodu gönderin';
    }
    if (!progress.otpVerified) {
      return 'SMS kodunu girin ve doğrulayın';
    }
    return 'Tüm adımlar tamamlandı!';
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sözleşme İlerlemesi</h3>
          <p className="text-sm text-gray-600 mt-1">{getNextAction()}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: BRAND_COLORS.navy }}>
            {completionPercentage}%
          </div>
          <div className="text-xs text-gray-500">
            {completedCount} / {totalCount} tamamlandı
          </div>
        </div>
      </div>

      <div className="relative pt-2 pb-4">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: BRAND_COLORS.navy,
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {requirements.map((req, index) => {
          const isNextAction =
            !req.completed &&
            requirements.slice(0, index).every((r) => r.completed);
          const isBlocked =
            !req.completed && requirements.slice(0, index).some((r) => !r.completed);

          return (
            <div
              key={req.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                req.completed
                  ? 'bg-green-50 border border-green-200'
                  : isNextAction
                  ? 'bg-yellow-50 border border-yellow-300 animate-pulse'
                  : isBlocked
                  ? 'bg-gray-50 border border-gray-200 opacity-60'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(req.completed, isBlocked)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-medium ${
                      req.completed
                        ? 'text-green-700'
                        : isNextAction
                        ? 'text-yellow-800'
                        : 'text-gray-700'
                    }`}
                  >
                    {req.label}
                  </p>
                  {isNextAction && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Şimdi
                    </span>
                  )}
                  {req.completed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Tamamlandı
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-0.5 ${
                    req.completed
                      ? 'text-green-600'
                      : isBlocked
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {req.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {completionPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-800">
              Tüm gereksinimler tamamlandı! Artık sözleşmeyi onaylayabilirsiniz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractProgressIndicator;
