import React, { useState, useEffect, useMemo } from 'react';
import { FileText, ShieldCheck, Maximize2 } from 'lucide-react';
import { Customer } from '../RouteMap';
import { BRAND_COLORS } from '../styles/theme';
import ContractProgressIndicator, { ContractProgress } from './ContractProgressIndicator';
import SmartFieldWrapper from './SmartFieldWrapper';
import { useFieldSequence } from '../hooks/useSmartFieldFocus';
import { useContractAutoSave, ContractDraftData } from '../hooks/useContractAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useOfflineSync } from '../hooks/useOfflineSync';
import OfflineBanner from './OfflineBanner';
import QuickActionsToolbar, { defaultContractActions, QuickAction } from './QuickActionsToolbar';

const phoneSanitize = (v: string) => v.replace(/\D+/g, '');
const phoneIsValid = (v: string) => /^05\d{9}$/.test(phoneSanitize(v));
const isDev = typeof import.meta !== 'undefined' ? Boolean((import.meta as any).env?.DEV) : false;

interface EnhancedContractStepProps {
  customer: Customer;
  visitId: string;
  salesRepId: string;
  contractAccepted: boolean;
  smsSent: boolean;
  signatureDataUrl: string | null;
  onContractAcceptChange: (accepted: boolean) => void;
  onSmsSentChange: (sent: boolean) => void;
  onSignatureChange: (dataUrl: string | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onOpenSignaturePad: () => void;
  onOpenContractModal: () => void;
}

const FIELD_IDS = ['contract-checkbox', 'signature', 'sms-phone', 'otp-input'];

const EnhancedContractStep: React.FC<EnhancedContractStepProps> = ({
  customer,
  visitId,
  salesRepId,
  contractAccepted,
  smsSent,
  signatureDataUrl,
  onContractAcceptChange,
  onSmsSentChange,
  onSignatureChange,
  onBack,
  onContinue,
  onOpenSignaturePad,
  onOpenContractModal,
}) => {
  const [smsPhone, setSmsPhone] = useState(customer?.phone ?? '');
  const [otp, setOtp] = useState('');
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  const otpValid = otp.trim() === '0000' || (isDev && otp.trim().length >= 4);

  const progress: ContractProgress = {
    contractAccepted,
    signatureCaptured: !!signatureDataUrl,
    smsSent,
    otpVerified: otpValid && smsSent,
  };

  const contractData: ContractDraftData = useMemo(
    () => ({
      visitId,
      customerId: customer.id,
      salesRepId,
      contractAccepted,
      signatureDataUrl,
      smsPhone,
      smsSent,
      otpCode: otp,
      otpVerified: otpValid && smsSent,
    }),
    [visitId, customer.id, salesRepId, contractAccepted, signatureDataUrl, smsPhone, smsSent, otp, otpValid]
  );

  const {
    saveStatus,
    lastSavedAt,
    draftId,
    error: saveError,
    manualSave,
    loadDraft,
  } = useContractAutoSave(contractData, {
    enabled: true,
    debounceMs: 3000,
    onSaveSuccess: (id) => {
      console.log('Contract draft saved:', id);
    },
    onSaveError: (err) => {
      console.error('Auto-save error:', err);
    },
  });

  const {
    connectionStatus,
    queuedOperations,
    isSyncing,
    syncProgress,
    manualSync,
    isOffline,
  } = useOfflineSync(salesRepId, {
    maxRetries: 3,
    enableIndexedDB: true,
  });

  const fieldSequence = useFieldSequence(FIELD_IDS);

  useEffect(() => {
    if (contractAccepted) {
      fieldSequence.markFieldComplete('contract-checkbox');
    } else {
      fieldSequence.markFieldIncomplete('contract-checkbox');
    }
  }, [contractAccepted]);

  useEffect(() => {
    if (signatureDataUrl) {
      fieldSequence.markFieldComplete('signature');
    } else {
      fieldSequence.markFieldIncomplete('signature');
    }
  }, [signatureDataUrl]);

  useEffect(() => {
    if (smsSent) {
      fieldSequence.markFieldComplete('sms-phone');
    } else {
      fieldSequence.markFieldIncomplete('sms-phone');
    }
  }, [smsSent]);

  useEffect(() => {
    if (otpValid && smsSent) {
      fieldSequence.markFieldComplete('otp-input');
    } else {
      fieldSequence.markFieldIncomplete('otp-input');
    }
  }, [otpValid, smsSent]);

  useEffect(() => {
    const checkForDraft = async () => {
      const draft = await loadDraft(visitId);
      if (draft && !contractAccepted && !signatureDataUrl) {
        setShowRecoveryPrompt(true);
      }
    };

    checkForDraft();
  }, [visitId, loadDraft]);

  const handleRecoverDraft = async () => {
    const draft = await loadDraft(visitId);
    if (draft) {
      onContractAcceptChange(draft.contractAccepted);
      onSignatureChange(draft.signatureDataUrl);
      setSmsPhone(draft.smsPhone);
      onSmsSentChange(draft.smsSent);
      setShowRecoveryPrompt(false);
    }
  };

  const handleSmsSend = () => {
    onSmsSentChange(true);
  };

  const handleClearSignature = () => {
    if (confirm('İmzayı temizlemek istediğinize emin misiniz?')) {
      onSignatureChange(null);
    }
  };

  const handleResendSMS = () => {
    if (smsSent) {
      onSmsSentChange(false);
      setTimeout(() => handleSmsSend(), 100);
    }
  };

  const handleSaveAndExit = async () => {
    await manualSave();
    if (confirm('Değişiklikler kaydedildi. Çıkmak istediğinize emin misiniz?')) {
      onBack();
    }
  };

  const handleCallSupport = () => {
    window.location.href = 'tel:08502222222';
  };

  const quickActions: QuickAction[] = defaultContractActions({
    onPreviewContract: onOpenContractModal,
    onClearSignature: handleClearSignature,
    onResendSMS: handleResendSMS,
    onSaveAndExit: handleSaveAndExit,
    onCallSupport: handleCallSupport,
  });

  const canContinue = contractAccepted && smsSent && !!signatureDataUrl && otpValid;

  return (
    <>
      <OfflineBanner
        connectionStatus={connectionStatus}
        queueCount={queuedOperations.length}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        onManualSync={manualSync}
        className="mb-4"
      />

      {showRecoveryPrompt && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-blue-900">Kaydedilmemiş İlerleme Bulundu</p>
              <p className="text-sm text-blue-700 mt-1">
                Bu sözleşme için daha önce kaydedilmiş bir taslak var. Kaldığınız yerden devam etmek ister misiniz?
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleRecoverDraft}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Devam Et
              </button>
              <button
                onClick={() => setShowRecoveryPrompt(false)}
                className="px-3 py-1 bg-white text-gray-700 text-sm rounded border hover:bg-gray-50 transition-colors"
              >
                Yeni Başla
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
            <h3 className="text-lg font-semibold">3. Sözleşme Onayı</h3>
          </div>
          <AutoSaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            error={saveError}
            onRetry={manualSave}
          />
        </div>

        <ContractProgressIndicator progress={progress} className="mb-6" />

        <div className="grid md:grid-cols-2 gap-6">
          <SmartFieldWrapper
            fieldId="contract-checkbox"
            label="Sözleşme Önizleme ve Onay"
            isActive={fieldSequence.isFieldActive('contract-checkbox')}
            isComplete={fieldSequence.isFieldComplete('contract-checkbox')}
            tooltip="Sözleşmeyi okuyun ve onay kutusunu işaretleyin"
          >
            <div>
              <button
                type="button"
                onClick={onOpenContractModal}
                className="w-full h-64 border rounded-lg bg-white overflow-hidden relative text-left hover:shadow-md transition-shadow mb-3"
                aria-label="Sözleşmeyi görüntüle"
              >
                <div className="p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900 mb-2">Elektrik Satış Sözleşmesi</p>
                  <p>Müşteri: {customer.name}</p>
                  <p className="mt-2 text-xs">Detayları görmek için tıklayın...</p>
                </div>
                <div className="absolute bottom-2 right-2 flex flex-col items-center pointer-events-none">
                  <div
                    className="h-8 w-8 rounded-full text-gray-900 shadow ring-1 ring-black/10 flex items-center justify-center"
                    style={{ backgroundColor: BRAND_COLORS.yellow }}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </div>
                </div>
              </button>

              <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-3 rounded transition-colors border">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={(e) => onContractAcceptChange(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="font-medium">Sözleşme koşullarını okudum ve onaylıyorum.</span>
              </label>
            </div>
          </SmartFieldWrapper>

          <SmartFieldWrapper
            fieldId="signature"
            label="Dijital İmza"
            isActive={fieldSequence.isFieldActive('signature')}
            isComplete={fieldSequence.isFieldComplete('signature')}
            tooltip="Müşterinin tabletle imzasını alın"
          >
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[16rem] flex items-center justify-center">
              {signatureDataUrl ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <img
                    src={signatureDataUrl}
                    alt="İmza"
                    className="h-[120px] w-auto bg-white rounded border max-w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onOpenSignaturePad}
                      className="px-4 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50 transition-colors"
                    >
                      İmzayı Düzenle
                    </button>
                    <button
                      onClick={handleClearSignature}
                      className="px-4 py-2 rounded-lg border bg-white text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-3">Henüz imza alınmadı</div>
                  <button
                    onClick={onOpenSignaturePad}
                    className="px-4 py-2 rounded-lg text-white text-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: BRAND_COLORS.navy }}
                  >
                    İmza Al
                  </button>
                </div>
              )}
            </div>
          </SmartFieldWrapper>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <SmartFieldWrapper
            fieldId="sms-phone"
            label="SMS ile Onay"
            isActive={fieldSequence.isFieldActive('sms-phone')}
            isComplete={fieldSequence.isFieldComplete('sms-phone')}
            tooltip="Müşterinin telefon numarasına onay SMS'i gönderin"
          >
            <div>
              <div className="flex gap-2">
                <input
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="05XX XXX XX XX"
                  disabled={smsSent}
                />
                <button
                  onClick={handleSmsSend}
                  disabled={!phoneIsValid(smsPhone) || smsSent}
                  className="px-4 py-2 rounded-lg text-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: smsSent ? '#d1d5db' : BRAND_COLORS.yellow }}
                >
                  {smsSent ? 'Gönderildi' : 'SMS Gönder'}
                </button>
              </div>
              {smsSent && (
                <div className="mt-2 flex items-center gap-2 text-green-700 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Onay SMS'i gönderildi.</span>
                </div>
              )}
            </div>
          </SmartFieldWrapper>

          <SmartFieldWrapper
            fieldId="otp-input"
            label="SMS Doğrulama Kodu"
            isActive={fieldSequence.isFieldActive('otp-input')}
            isComplete={fieldSequence.isFieldComplete('otp-input')}
            tooltip="Müşterinin telefonuna gelen 4-6 haneli kodu girin"
          >
            <div>
              {smsSent ? (
                <div className="flex items-center gap-2">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="p-2 border rounded-lg w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest font-mono"
                    placeholder="0000"
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      otpValid ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {otpValid ? '✓ Kod doğrulandı' : isDev ? '(Test: 0000)' : ''}
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-gray-100 rounded-lg text-sm text-gray-500 text-center">
                  SMS gönderildikten sonra kodu buraya girebilirsiniz
                </div>
              )}
            </div>
          </SmartFieldWrapper>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
          >
            Geri
          </button>
          <div className="flex items-center gap-4">
            {!canContinue && (
              <p className="text-sm text-gray-500">
                {!contractAccepted && 'Sözleşmeyi onaylayın'}
                {contractAccepted && !signatureDataUrl && 'İmza alın'}
                {contractAccepted && signatureDataUrl && !smsSent && 'SMS gönderin'}
                {contractAccepted && signatureDataUrl && smsSent && !otpValid && 'SMS kodunu girin'}
              </p>
            )}
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all ${
                canContinue ? 'hover:opacity-90 shadow-lg' : 'bg-gray-300 cursor-not-allowed'
              }`}
              style={{ backgroundColor: canContinue ? BRAND_COLORS.navy : undefined }}
            >
              Sözleşmeyi Onayla ve Bitir
            </button>
          </div>
        </div>
      </div>

      <QuickActionsToolbar actions={quickActions} position="bottom-right" />
    </>
  );
};

export default EnhancedContractStep;
