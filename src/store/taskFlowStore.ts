import { create } from 'zustand';
import type { Database } from '../lib/database.types';

type VisitStatus = Database['public']['Enums']['visit_status'];

export type FlowStep = 'SETUP' | 'CUSTOMER' | 'KYC' | 'CONTRACT' | 'RESULT' | 'DONE';

export type FlowEvent =
  | 'START_VISIT'
  | 'SET_CUSTOMER'
  | 'KYC_OK'
  | 'CONTRACT_ACCEPTED'
  | 'SET_RESULT'
  | 'OOR_DETECTED'
  | 'OOR_APPROVAL_REQUESTED'
  | 'OOR_APPROVED'
  | 'SAVE_DRAFT'
  | 'FINALIZE';

interface CustomerData {
  id?: string;
  name?: string;
  address?: string;
  district?: string;
  phone?: string;
  customerType?: 'residential' | 'commercial' | 'industrial';
  location?: { lat: number; lng: number };
}

interface KYCData {
  kvkkAccepted: boolean;
  smsVerified: boolean;
  idPhotoUrl?: string;
  nfcVerified: boolean;
  representativeName?: string;
  representativePhone?: string;
  representativeEmail?: string;
  representativeConsent?: boolean;
}

interface ContractData {
  contractAccepted: boolean;
  signatureDataUrl?: string;
  smsVerified: boolean;
}

interface ResultData {
  status: VisitStatus;
  notes?: string;
  revenueAmount?: number;
}

interface OORData {
  isOutOfRegion: boolean;
  approvalRequested: boolean;
  approvalGranted: boolean;
  requestedBy?: string;
  approverUserId?: string;
  reason?: string;
  estimatedRevenue?: number;
}

interface TaskFlowState {
  currentStep: FlowStep;
  visitId?: string;
  visitStatus: VisitStatus;

  customerData: CustomerData;
  kycData: KYCData;
  contractData: ContractData;
  resultData: ResultData;
  oorData: OORData;

  lastDraftSaveTime?: number;

  dispatch: (event: FlowEvent, payload?: any) => void;

  canNextFromKYC: () => boolean;
  requiresOOR: (repRegion?: string) => boolean;
  canFinalize: () => boolean;

  reset: () => void;
}

const initialState = {
  currentStep: 'SETUP' as FlowStep,
  visitStatus: 'planned' as VisitStatus,
  customerData: {},
  kycData: {
    kvkkAccepted: false,
    smsVerified: false,
    nfcVerified: false,
  },
  contractData: {
    contractAccepted: false,
    smsVerified: false,
  },
  resultData: {
    status: 'planned' as VisitStatus,
  },
  oorData: {
    isOutOfRegion: false,
    approvalRequested: false,
    approvalGranted: false,
  },
};

export const useTaskFlowStore = create<TaskFlowState>((set, get) => ({
  ...initialState,

  dispatch: (event: FlowEvent, payload?: any) => {
    const state = get();

    switch (event) {
      case 'START_VISIT':
        set({
          currentStep: 'CUSTOMER',
          visitStatus: 'in_progress',
          visitId: payload?.visitId,
        });
        break;

      case 'SET_CUSTOMER':
        set({
          customerData: { ...state.customerData, ...payload },
        });

        if (state.requiresOOR(payload?.repRegion)) {
          set({
            oorData: {
              ...state.oorData,
              isOutOfRegion: true,
            },
          });
        }
        break;

      case 'OOR_DETECTED':
        set({
          oorData: {
            ...state.oorData,
            isOutOfRegion: true,
            ...payload,
          },
        });
        break;

      case 'OOR_APPROVAL_REQUESTED':
        set({
          oorData: {
            ...state.oorData,
            approvalRequested: true,
            requestedBy: payload?.requestedBy,
            approverUserId: payload?.approverUserId,
            reason: payload?.reason,
            estimatedRevenue: payload?.estimatedRevenue,
          },
        });
        break;

      case 'OOR_APPROVED':
        set({
          oorData: {
            ...state.oorData,
            approvalGranted: true,
          },
          currentStep: 'KYC',
        });
        break;

      case 'KYC_OK':
        if (state.canNextFromKYC()) {
          set({
            kycData: { ...state.kycData, ...payload },
            currentStep: 'CONTRACT',
          });
        }
        break;

      case 'CONTRACT_ACCEPTED':
        set({
          contractData: { ...state.contractData, ...payload },
        });
        break;

      case 'SET_RESULT':
        set({
          resultData: { ...state.resultData, ...payload },
        });
        break;

      case 'SAVE_DRAFT':
        set({
          lastDraftSaveTime: Date.now(),
        });
        break;

      case 'FINALIZE':
        if (state.canFinalize()) {
          set({
            currentStep: 'DONE',
            visitStatus: state.resultData.status,
          });
        }
        break;

      default:
        break;
    }
  },

  canNextFromKYC: () => {
    const { kycData, customerData } = get();

    if (customerData.customerType === 'residential') {
      return kycData.kvkkAccepted && kycData.smsVerified;
    }

    return !!(
      kycData.representativeName &&
      kycData.representativePhone &&
      kycData.representativeConsent
    );
  },

  requiresOOR: (repRegion?: string) => {
    const { customerData } = get();
    if (!repRegion || !customerData.district) return false;
    return repRegion.toLowerCase() !== customerData.district.toLowerCase();
  },

  canFinalize: () => {
    const { contractData, resultData, oorData } = get();

    if (oorData.isOutOfRegion && !oorData.approvalGranted) {
      return false;
    }

    return contractData.contractAccepted && contractData.smsVerified && !!resultData.status;
  },

  reset: () => set(initialState),
}));
