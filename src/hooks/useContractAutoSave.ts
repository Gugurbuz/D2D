import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ContractDraftData {
  visitId: string;
  customerId: string;
  salesRepId: string;
  contractAccepted: boolean;
  signatureDataUrl: string | null;
  smsPhone: string;
  smsSent: boolean;
  otpCode: string;
  otpVerified: boolean;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  maxRetries: number;
  onSaveSuccess?: (draftId: string) => void;
  onSaveError?: (error: Error) => void;
}

export const useContractAutoSave = (
  data: ContractDraftData,
  config: Partial<AutoSaveConfig> = {}
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const previousDataRef = useRef<string>('');

  const defaultConfig: AutoSaveConfig = {
    enabled: true,
    debounceMs: 3000,
    maxRetries: 3,
    ...config,
  };

  const logAuditAction = async (
    draftId: string,
    action: string,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await supabase.from('contract_audit_log').insert({
        contract_draft_id: draftId,
        visit_id: data.visitId,
        sales_rep_id: data.salesRepId,
        action,
        description,
        metadata: metadata || {},
        session_id: sessionStorage.getItem('session_id') || undefined,
      });
    } catch (err) {
      console.error('Failed to log audit action:', err);
    }
  };

  const calculateCompletion = (draft: ContractDraftData): number => {
    let completed = 0;
    if (draft.contractAccepted) completed += 25;
    if (draft.signatureDataUrl) completed += 25;
    if (draft.smsSent) completed += 25;
    if (draft.otpVerified) completed += 25;
    return completed;
  };

  const determineStage = (draft: ContractDraftData): string => {
    if (draft.otpVerified) return 'otp_verified';
    if (draft.smsSent) return 'sms_sent';
    if (draft.signatureDataUrl) return 'signature_captured';
    if (draft.contractAccepted) return 'contract_preview';
    return 'info_verified';
  };

  const saveDraft = useCallback(async () => {
    if (!defaultConfig.enabled) return;

    const currentDataStr = JSON.stringify(data);
    if (currentDataStr === previousDataRef.current && draftId) {
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      const completionPercentage = calculateCompletion(data);
      const currentStage = determineStage(data);

      const draftData = {
        visit_id: data.visitId,
        customer_id: data.customerId,
        sales_rep_id: data.salesRepId,
        contract_accepted: data.contractAccepted,
        signature_data_url: data.signatureDataUrl,
        sms_phone: data.smsPhone,
        sms_sent: data.smsSent,
        otp_verified: data.otpVerified,
        notes: data.notes,
        completion_percentage: completionPercentage,
        current_stage: currentStage,
        last_saved_at: new Date().toISOString(),
        metadata: data.metadata || {},
        session_id: sessionStorage.getItem('session_id') || undefined,
      };

      let result;

      if (draftId) {
        const { data: updateData, error: updateError } = await supabase
          .from('contract_drafts')
          .update(draftData)
          .eq('id', draftId)
          .select()
          .maybeSingle();

        if (updateError) throw updateError;
        result = updateData;

        await logAuditAction(draftId, 'auto_save_triggered', 'Contract draft auto-saved', {
          completion: completionPercentage,
          stage: currentStage,
        });
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('contract_drafts')
          .insert(draftData)
          .select()
          .maybeSingle();

        if (insertError) throw insertError;
        result = insertData;

        if (result?.id) {
          setDraftId(result.id);
          await logAuditAction(result.id, 'contract_opened', 'Contract draft created');
        }
      }

      setSaveStatus('saved');
      setLastSavedAt(new Date());
      previousDataRef.current = currentDataStr;
      retryCountRef.current = 0;

      if (defaultConfig.onSaveSuccess && result?.id) {
        defaultConfig.onSaveSuccess(result.id);
      }

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Auto-save failed:', err);
      const error = err instanceof Error ? err : new Error('Auto-save failed');
      setError(error);

      if (retryCountRef.current < defaultConfig.maxRetries) {
        retryCountRef.current++;
        setSaveStatus('saving');
        setTimeout(() => {
          saveDraft();
        }, 1000 * retryCountRef.current);
      } else {
        setSaveStatus('error');
        if (defaultConfig.onSaveError) {
          defaultConfig.onSaveError(error);
        }
      }
    }
  }, [data, draftId, defaultConfig]);

  useEffect(() => {
    if (!defaultConfig.enabled) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, defaultConfig.debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, saveDraft, defaultConfig.enabled, defaultConfig.debounceMs]);

  const manualSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveDraft();
  }, [saveDraft]);

  const loadDraft = useCallback(async (visitId: string) => {
    try {
      const { data: draft, error } = await supabase
        .from('contract_drafts')
        .select('*')
        .eq('visit_id', visitId)
        .eq('is_draft', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (draft) {
        setDraftId(draft.id);
        return {
          visitId: draft.visit_id,
          customerId: draft.customer_id,
          salesRepId: draft.sales_rep_id,
          contractAccepted: draft.contract_accepted,
          signatureDataUrl: draft.signature_data_url,
          smsPhone: draft.sms_phone || '',
          smsSent: draft.sms_sent,
          otpCode: '',
          otpVerified: draft.otp_verified,
          notes: draft.notes,
          metadata: draft.metadata,
        } as ContractDraftData;
      }

      return null;
    } catch (err) {
      console.error('Failed to load draft:', err);
      return null;
    }
  }, []);

  const deleteDraft = useCallback(async () => {
    if (!draftId) return;

    try {
      await supabase.from('contract_drafts').delete().eq('id', draftId);
      setDraftId(null);
      previousDataRef.current = '';
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  }, [draftId]);

  return {
    saveStatus,
    lastSavedAt,
    draftId,
    error,
    manualSave,
    loadDraft,
    deleteDraft,
  };
};
