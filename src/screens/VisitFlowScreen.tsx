import React, { useReducer, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  IdCard, Camera, FileText,
  ChevronRight, ShieldCheck, CheckCircle, XCircle, UserX, Clock,
  Loader2, ScanLine, Nfc, Maximize2, MapPin, Home, Building, Factory,
  Sparkles
} from 'lucide-react';
import { Customer } from '../RouteMap';
import { BRAND_COLORS } from '../styles/theme';

/*************************** Utils ***************************/
const isDev = typeof import.meta !== 'undefined' ? Boolean((import.meta as any).env?.DEV) : false;

const fmtTRY = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n || 0);

const phoneSanitize = (v: string) => v.replace(/\D+/g, '');
const phoneIsValid = (v: string) => /^05\d{9}$/.test(phoneSanitize(v));

const track = (event: string, props?: Record<string, any>) => {
  if (isDev) console.debug('[track]', event, props || {});
};

/*************************** State Machine Definition ***************************/

// State Machine States
type MachineState = 
  | 'INITIAL'
  | 'CHECKIN'
  | 'LOCATION_VERIFYING'
  | 'LOCATION_VERIFIED'
  | 'PROPOSAL'
  | 'VISIT_STATUS_SELECTION'
  | 'CONTRACT_FLOW'
  | 'CUSTOMER_INFO'
  | 'ID_VERIFICATION'
  | 'CONTRACT_SIGNING'
  | 'COMPLETION'
  | 'VISIT_COMPLETED'
  | 'VISIT_REJECTED'
  | 'VISIT_UNREACHABLE'
  | 'VISIT_POSTPONED';

// Events that can trigger state transitions
type MachineEvent =
  | { type: 'START_CHECKIN' }
  | { type: 'LOCATION_FOUND'; distance: number }
  | { type: 'LOCATION_ERROR'; error: string }
  | { type: 'LOCATION_CONFIRMED' }
  | { type: 'PROPOSAL_COMPLETED' }
  | { type: 'CONTRACT_START' }
  | { type: 'VISIT_REJECTED' }
  | { type: 'VISIT_UNREACHABLE' }
  | { type: 'VISIT_POSTPONED' }
  | { type: 'CUSTOMER_INFO_CONFIRMED' }
  | { type: 'ID_VERIFIED' }
  | { type: 'CONTRACT_SIGNED' }
  | { type: 'COMPLETION_CONFIRMED' }
  | { type: 'RESET' }
  | { type: 'GO_BACK' };

// Context data that persists through state transitions
type MachineContext = {
  customer: Customer;
  locationDistance: number | null;
  locationError: string | null;
  idPhoto: string | null;
  ocrStatus: 'idle' | 'scanning' | 'success' | 'error';
  nfcStatus: 'idle' | 'scanning' | 'success' | 'error';
  contractAccepted: boolean;
  smsSent: boolean;
  smsCode: string;
  signatureDataUrl: string | null;
  notes: string;
};

type StateMachineState = {
  value: MachineState;
  context: MachineContext;
  history: MachineState[];
};

// State Machine Configuration
const stateMachineConfig = {
  INITIAL: {
    on: {
      START_CHECKIN: 'CHECKIN' as MachineState
    }
  },
  CHECKIN: {
    on: {
      LOCATION_FOUND: 'LOCATION_VERIFYING' as MachineState,
      LOCATION_ERROR: 'CHECKIN' as MachineState
    },
    entry: 'startLocationCheck'
  },
  LOCATION_VERIFYING: {
    on: {
      LOCATION_CONFIRMED: 'LOCATION_VERIFIED' as MachineState
    },
    after: {
      2000: 'LOCATION_VERIFIED' // Auto-advance after 2 seconds if location is good
    }
  },
  LOCATION_VERIFIED: {
    on: {
      PROPOSAL_COMPLETED: 'PROPOSAL' as MachineState
    },
    entry: 'autoAdvanceToProposal'
  },
  PROPOSAL: {
    on: {
      PROPOSAL_COMPLETED: 'VISIT_STATUS_SELECTION' as MachineState
    }
  },
  VISIT_STATUS_SELECTION: {
    on: {
      CONTRACT_START: 'CONTRACT_FLOW' as MachineState,
      VISIT_REJECTED: 'VISIT_REJECTED' as MachineState,
      VISIT_UNREACHABLE: 'VISIT_UNREACHABLE' as MachineState,
      VISIT_POSTPONED: 'VISIT_POSTPONED' as MachineState
    }
  },
  CONTRACT_FLOW: {
    on: {
      CUSTOMER_INFO_CONFIRMED: 'CUSTOMER_INFO' as MachineState
    },
    entry: 'initContractFlow'
  },
  CUSTOMER_INFO: {
    on: {
      CUSTOMER_INFO_CONFIRMED: 'ID_VERIFICATION' as MachineState,
      GO_BACK: 'VISIT_STATUS_SELECTION' as MachineState
    }
  },
  ID_VERIFICATION: {
    on: {
      ID_VERIFIED: 'CONTRACT_SIGNING' as MachineState,
      GO_BACK: 'CUSTOMER_INFO' as MachineState
    }
  },
  CONTRACT_SIGNING: {
    on: {
      CONTRACT_SIGNED: 'COMPLETION' as MachineState,
      GO_BACK: 'ID_VERIFICATION' as MachineState
    }
  },
  COMPLETION: {
    on: {
      COMPLETION_CONFIRMED: 'VISIT_COMPLETED' as MachineState,
      GO_BACK: 'CONTRACT_SIGNING' as MachineState
    }
  },
  VISIT_COMPLETED: {
    type: 'final' as const
  },
  VISIT_REJECTED: {
    type: 'final' as const
  },
  VISIT_UNREACHABLE: {
    type: 'final' as const
  },
  VISIT_POSTPONED: {
    type: 'final' as const
  }
};

// Guards (conditions for state transitions)
const guards = {
  isLocationClose: (context: MachineContext) => (context.locationDistance !== null && context.locationDistance <= 200),
  isIdVerified: (context: MachineContext) => context.ocrStatus === 'success' && context.nfcStatus === 'success',
  isContractReady: (context: MachineContext) => 
    context.contractAccepted && 
    context.smsSent && 
    context.signatureDataUrl !== null && 
    (context.smsCode === '0000' || (isDev && context.smsCode.length >= 4))
};

// Actions (side effects)
const actions = {
  startLocationCheck: (context: MachineContext) => {
    track('location_check_started');
  },
  autoAdvanceToProposal: (context: MachineContext) => {
    track('auto_advance_to_proposal');
  },
  initContractFlow: (context: MachineContext) => {
    track('contract_flow_started');
  }
};

// State Machine Reducer
type MachineAction = MachineEvent | { type: 'UPDATE_CONTEXT'; payload: Partial<MachineContext> };

function stateMachineReducer(state: StateMachineState, action: MachineAction): StateMachineState {
  if (action.type === 'UPDATE_CONTEXT') {
    return {
      ...state,
      context: { ...state.context, ...action.payload }
    };
  }

  if (action.type === 'RESET') {
    return {
      value: 'INITIAL',
      context: { 
        ...state.context,
        locationDistance: null,
        locationError: null,
        idPhoto: null,
        ocrStatus: 'idle',
        nfcStatus: 'idle',
        contractAccepted: false,
        smsSent: false,
        smsCode: '',
        signatureDataUrl: null,
        notes: ''
      },
      history: []
    };
  }

  const currentStateConfig = stateMachineConfig[state.value];
  if (!currentStateConfig || !currentStateConfig.on) {
    return state;
  }

  const targetState = currentStateConfig.on[action.type];
  if (!targetState) {
    return state;
  }

  // Handle context updates based on events
  let newContext = { ...state.context };
  
  switch (action.type) {
    case 'LOCATION_FOUND':
      newContext.locationDistance = action.distance;
      newContext.locationError = null;
      break;
    case 'LOCATION_ERROR':
      newContext.locationError = action.error;
      newContext.locationDistance = null;
      break;
  }

  const newState: StateMachineState = {
    value: targetState,
    context: newContext,
    history: [...state.history, state.value]
  };

  // Execute entry actions
  const entryAction = stateMachineConfig[targetState]?.entry;
  if (entryAction && actions[entryAction as keyof typeof actions]) {
    actions[entryAction as keyof typeof actions](newState.context);
  }

  return newState;
}

/*************************** Types / Data ***************************/

type Tariff = {
  id: string;
  name: string;
  unitPrice: number;
  type: Customer['customerType'][];
};

const ALL_TARIFFS: Tariff[] = [
  { id: 'standart_mesken', name: 'Standart Konut', unitPrice: 2.10, type: ['Mesken'] },
  { id: 'yesil_evim', name: 'Yeşil Evim', unitPrice: 2.25, type: ['Mesken'] },
  { id: 'is_yeri_eko', name: 'Ekonomik Ticarethane', unitPrice: 3.50, type: ['Ticarethane'] },
  { id: 'is_yeri_pro', name: 'Profesyonel Ticarethane', unitPrice: 3.35, type: ['Ticarethane'] },
  { id: 'sanayi_eko', name: 'Sanayi Avantaj', unitPrice: 3.10, type: ['Sanayi'] },
];

type VisitStatus = 'Pending' | 'InProgress' | 'Completed' | 'Rejected' | 'Unreachable' | 'Postponed';

type Props = {
  customer: Customer;
  onCloseToList: () => void;
  onCompleteVisit: (updated: Customer, status: VisitStatus, notes: string) => void;
};

/*************************** State Machine Hook ***************************/

const useStateMachine = (customer: Customer) => {
  const initialState: StateMachineState = {
    value: 'INITIAL',
    context: {
      customer,
      locationDistance: null,
      locationError: null,
      idPhoto: null,
      ocrStatus: 'idle',
      nfcStatus: 'idle',
      contractAccepted: false,
      smsSent: false,
      smsCode: '',
      signatureDataUrl: null,
      notes: ''
    },
    history: []
  };

  const [state, dispatch] = useReducer(stateMachineReducer, initialState);

  const send = useCallback((event: MachineEvent) => {
    dispatch(event);
  }, []);

  const updateContext = useCallback((updates: Partial<MachineContext>) => {
    dispatch({ type: 'UPDATE_CONTEXT', payload: updates });
  }, []);

  // Auto-advance logic for location verification
  useEffect(() => {
    if (state.value === 'LOCATION_VERIFYING' && guards.isLocationClose(state.context)) {
      const timer = setTimeout(() => {
        send({ type: 'LOCATION_CONFIRMED' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.value, state.context, send]);

  // Auto-advance to proposal after location confirmed
  useEffect(() => {
    if (state.value === 'LOCATION_VERIFIED') {
      const timer = setTimeout(() => {
        send({ type: 'PROPOSAL_COMPLETED' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.value, send]);

  // Helper functions for checking current state
  const is = useCallback((stateName: MachineState | MachineState[]) => {
    const states = Array.isArray(stateName) ? stateName : [stateName];
    return states.includes(state.value);
  }, [state.value]);

  const can = useCallback((eventType: MachineEvent['type']) => {
    const currentConfig = stateMachineConfig[state.value];
    return currentConfig?.on?.[eventType] !== undefined;
  }, [state.value]);

  const matches = useCallback((pattern: string) => {
    return state.value.includes(pattern.toUpperCase());
  }, [state.value]);

  return {
    state: state.value,
    context: state.context,
    history: state.history,
    send,
    updateContext,
    is,
    can,
    matches,
    // Convenience getters
    isInContractFlow: matches('CONTRACT') || is(['CUSTOMER_INFO', 'ID_VERIFICATION', 'CONTRACT_SIGNING', 'COMPLETION']),
    isCompleted: is(['VISIT_COMPLETED', 'VISIT_REJECTED', 'VISIT_UNREACHABLE', 'VISIT_POSTPONED']),
    canGoBack: state.history.length > 0
  };
};

/*************************** Enhanced Step Indicator ***************************/

const StateMachineStepIndicator: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  const steps = [
    { key: 'CUSTOMER_INFO', label: 'Müşteri', number: 1 },
    { key: 'ID_VERIFICATION', label: 'Kimlik', number: 2 },
    { key: 'CONTRACT_SIGNING', label: 'Sözleşme', number: 3 },
    { key: 'COMPLETION', label: 'Tamamlama', number: 4 }
  ];

  if (!machine.isInContractFlow) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mb-6 px-2" aria-label="Sözleşme adımları">
      {steps.map((step, index) => {
        const isActive = machine.is(step.key as MachineState);
        const isCompleted = machine.history.includes(step.key as MachineState);
        const isAccessible = isCompleted || isActive;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isActive 
                    ? 'transform scale-110 shadow-lg' 
                    : isCompleted 
                    ? 'transform scale-100' 
                    : 'transform scale-90'
                }`}
                style={{
                  backgroundColor: isActive 
                    ? BRAND_COLORS.navy 
                    : isCompleted 
                    ? BRAND_COLORS.yellow 
                    : '#E5E7EB',
                  color: isActive || isCompleted ? '#FFFFFF' : '#9CA3AF'
                }}
              >
                {isCompleted && !isActive ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-xs mt-2 font-medium transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`h-1 w-16 mx-4 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-gradient-to-r from-yellow-400 to-blue-600' : 'bg-gray-200'
                }`} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/*************************** Root Component ***************************/

const VisitFlowScreen: React.FC<Props> = ({ customer, onCloseToList, onCompleteVisit }) => {
  const machine = useStateMachine(customer);

  // Start the flow automatically
  useEffect(() => {
    if (machine.state === 'INITIAL') {
      machine.send({ type: 'START_CHECKIN' });
    }
  }, []);

  const handleCompleteVisit = useCallback((status: VisitStatus) => {
    const statusMap: Record<string, VisitStatus> = {
      'VISIT_COMPLETED': 'Completed',
      'VISIT_REJECTED': 'Rejected',
      'VISIT_UNREACHABLE': 'Unreachable',
      'VISIT_POSTPONED': 'Postponed'
    };
    
    const finalStatus = statusMap[machine.state] || status;
    track('visit_completed', { status: finalStatus, customerId: customer.id });
    onCompleteVisit(customer, finalStatus, machine.context.notes);
    onCloseToList();
  }, [machine.state, machine.context.notes, customer, onCompleteVisit, onCloseToList]);

  // Handle final states
  useEffect(() => {
    if (machine.isCompleted) {
      handleCompleteVisit('Completed');
    }
  }, [machine.isCompleted, handleCompleteVisit]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* Header with state machine status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ziyaret: {customer.name}</h1>
          {isDev && (
            <p className="text-xs text-gray-500 mt-1">
              State: {machine.state} | Can go back: {machine.canGoBack ? 'Yes' : 'No'}
            </p>
          )}
        </div>
        <button 
          onClick={onCloseToList} 
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Listeye Dön
        </button>
      </div>

      {/* Step indicator for contract flow */}
      <StateMachineStepIndicator machine={machine} />

      {/* Screen rendering based on state machine */}
      {machine.is(['CHECKIN', 'LOCATION_VERIFYING', 'LOCATION_VERIFIED']) && (
        <CheckInScreen machine={machine} />
      )}

      {machine.is('PROPOSAL') && (
        <ProposalScreen customer={customer} machine={machine} />
      )}

      {machine.is('VISIT_STATUS_SELECTION') && (
        <VisitStatusSelection machine={machine} />
      )}

      {machine.is('CUSTOMER_INFO') && (
        <CustomerInfoStep machine={machine} />
      )}

      {machine.is('ID_VERIFICATION') && (
        <IdVerificationStep machine={machine} />
      )}

      {machine.is('CONTRACT_SIGNING') && (
        <ContractStep machine={machine} />
      )}

      {machine.is('COMPLETION') && (
        <CompletionStep machine={machine} />
      )}
    </div>
  );
};

/*************************** Check-in with State Machine ***************************/

const CheckInScreen: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  const { customer } = machine.context;

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (machine.is('CHECKIN')) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const dist = getDistance(userLat, userLng, customer.lat, customer.lng);
          machine.send({ type: 'LOCATION_FOUND', distance: dist });
        },
        (err) => {
          machine.send({ type: 'LOCATION_ERROR', error: `Konum alınamadı: ${err.message}` });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [machine.state]);

  const renderStatus = () => {
    if (machine.is('CHECKIN')) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
          </div>
          Konum alınıyor...
        </div>
      );
    }

    if (machine.is('LOCATION_VERIFYING')) {
      const { locationDistance, locationError } = machine.context;
      
      if (locationError) {
        return (
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="w-4 h-4" />
            {locationError}
          </div>
        );
      }

      if (locationDistance !== null) {
        const isClose = locationDistance <= 200;
        return isClose ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Müşteri konumundasınız ({locationDistance.toFixed(0)}m).
            <div className="ml-2 text-sm text-gray-600">Yönlendiriliyorsunuz...</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <XCircle className="w-4 h-4" />
            Müşteri konumundan uzaktasınız (~{(locationDistance / 1000).toFixed(1)} km).
          </div>
        );
      }
    }

    if (machine.is('LOCATION_VERIFIED')) {
      return (
        <div className="flex items-center gap-2 text-green-600 animate-pulse">
          <CheckCircle className="w-4 h-4" />
          Konum doğrulandı, teklif ekranına yönlendiriliyorsunuz...
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-6 h-6" style={{ color: BRAND_COLORS.navy }} />
        <h3 className="text-xl font-semibold">Ziyaret Başlangıç Onayı</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Teklif ekranına geçmeden önce, müşterinin lokasyonunda olduğunuzu doğrulayın.
        </p>
        
        <div className="p-4 bg-gray-100 rounded-lg border-l-4" style={{ borderColor: BRAND_COLORS.navy }}>
          <p className="font-semibold">{customer.name}</p>
          <p className="text-sm text-gray-700">
            {customer.address}, {customer.district}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm font-medium">
            {renderStatus()}
          </div>
          
          {machine.context.locationError && (
            <button
              className="mt-3 text-sm underline text-blue-600 hover:text-blue-800"
              onClick={() => {
                machine.updateContext({ locationDistance: 0, locationError: null });
                machine.send({ type: 'LOCATION_FOUND', distance: 0 });
                track('checkin_manual_confirm');
              }}
            >
              Konumu manuel olarak doğrula
            </button>
          )}
        </div>
      </div>

      {machine.is(['LOCATION_VERIFYING', 'LOCATION_VERIFIED']) && 
       guards.isLocationClose(machine.context) && (
        <div className="mt-6 text-right">
          <button
            onClick={() => machine.send({ type: 'LOCATION_CONFIRMED' })}
            className="text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transform hover:scale-105 transition-all"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Check-in Tamamla <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/*************************** Enhanced Proposal Screen ***************************/

const ProposalScreen: React.FC<{ 
  customer: Customer; 
  machine: ReturnType<typeof useStateMachine>;
}> = ({ customer, machine }) => {
  const FALLBACK_TARIFF: Tariff = {
    id: 'fallback',
    name: 'Lütfen Bir Tarife Seçin',
    unitPrice: 0,
    type: ['Mesken', 'Ticarethane', 'Sanayi'],
  };

  const [currentUnitPrice, setCurrentUnitPrice] = useState(2.2);
  const [currentConsumption, setCurrentConsumption] = useState(150);
  const [animateSavings, setAnimateSavings] = useState(false);

  const availableTariffs = useMemo(
    () => (customer.customerType ? ALL_TARIFFS.filter((t) => t.type.includes(customer.customerType)) : []),
    [customer.customerType]
  );

  const [selectedTariff, setSelectedTariff] = useState<Tariff>(availableTariffs[0] || FALLBACK_TARIFF);

  // Trigger savings animation when values change
  useEffect(() => {
    setAnimateSavings(true);
    const timer = setTimeout(() => setAnimateSavings(false), 600);
    return () => clearTimeout(timer);
  }, [currentUnitPrice, currentConsumption, selectedTariff.id]);

  useEffect(() => {
    if (!availableTariffs.length) {
      if (selectedTariff.id !== 'fallback') setSelectedTariff(FALLBACK_TARIFF);
      return;
    }
    if (!availableTariffs.some((t) => t.id === selectedTariff.id)) {
      setSelectedTariff(availableTariffs[0]);
    }
  }, [availableTariffs, selectedTariff.id]);

  const currentMonthlyBill = currentUnitPrice * currentConsumption;
  const enerjisaMonthlyBill = selectedTariff.unitPrice * currentConsumption;
  const annualSavings = (currentMonthlyBill - enerjisaMonthlyBill) * 12;

  const CustomerTypeIcon: Record<NonNullable<Customer['customerType']>, JSX.Element> = {
    Mesken: <Home className="w-6 h-6 text-gray-700" />,
    Ticarethane: <Building className="w-6 h-6 text-gray-700" />,
    Sanayi: <Factory className="w-6 h-6 text-gray-700" />,
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold">Teklif ve Tasarruf Simülasyonu</h3>
            {customer.isFreeConsumer && (
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 p-2 rounded-md animate-fade-in">
                <ShieldCheck className="w-5 h-5" />
                <span>Serbest Tüketici Olmaya Uygun</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            {customer.customerType ? CustomerTypeIcon[customer.customerType] : <UserX className="w-6 h-6 text-gray-500" />}
            <span className="font-medium">{customer.customerType || 'Tip Belirtilmemiş'}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Situation - Enhanced with sliders */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold text-lg mb-4">Mevcut Durum</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Birim Fiyat: {currentUnitPrice.toFixed(2)} TL/kWh
                </label>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.01"
                  value={currentUnitPrice}
                  onChange={(e) => setCurrentUnitPrice(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Aylık Tüketim: {currentConsumption} kWh
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="5"
                  value={currentConsumption}
                  onChange={(e) => setCurrentConsumption(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">Tahmini Aylık Fatura</p>
                <p className="text-2xl font-bold text-gray-800">{fmtTRY(currentMonthlyBill)}</p>
              </div>
            </div>
          </div>

          {/* Enerjisa Offer */}
          <div className="p-4 border-2 rounded-lg bg-white transition-all hover:shadow-md" style={{ borderColor: BRAND_COLORS.navy }}>
            <h4 className="font-semibold text-lg mb-4" style={{ color: BRAND_COLORS.navy }}>
              Enerjisa Teklifi
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tarife Seçimi</label>
                {availableTariffs.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Bu müşteri tipine ({customer.customerType}) uygun tarife bulunamadı.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedTariff.id}
                    onChange={(e) => setSelectedTariff(ALL_TARIFFS.find((t) => t.id === e.target.value)!)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {availableTariffs.map((tariff) => (
                      <option key={tariff.id} value={tariff.id}>
                        {tariff.name}
                      </option>
                    ))}
                  </select>
                )}
                
                {selectedTariff.id === 'yesil_evim' && (
                  <p className="text-xs text-green-700 mt-2 flex items-center gap-1 animate-fade-in">
                    <Sparkles className="w-3 h-3" /> Solar çözümlerde %10 indirim sağlar.
                  </p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Birim Fiyat (TL/kWh)</p>
                <p className="text-xl font-semibold">{selectedTariff.unitPrice.toFixed(2)} TL</p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">Enerjisa ile Tahmini Aylık Fatura</p>
                <p className="text-2xl font-bold" style={{ color: BRAND_COLORS.navy }}>
                  {fmtTRY(enerjisaMonthlyBill)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Savings Display */}
        <div className={`mt-6 p-6 rounded-lg border text-center transition-all duration-500 ${
          animateSavings ? 'transform scale-105 shadow-lg' : 'transform scale-100'
        }`} style={{ backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }}>
          <p className="text-lg font-medium" style={{ color: '#065F46' }}>
            Yıllık Tahmini Tasarruf
          </p>
          <p className={`text-4xl font-bold my-2 transition-all duration-300 ${
            animateSavings ? 'transform scale-110' : 'transform scale-100'
          }`} style={{ color: '#047857' }}>
            {selectedTariff.id !== 'fallback' ? (annualSavings > 0 ? fmtTRY(annualSavings) : 'Tasarruf Yok') : '-'}
          </p>
        </div>

        {selectedTariff.id === 'yesil_evim' && (
          <div className="mt-4 p-4 rounded-lg border text-center animate-fade-in transition-all hover:shadow-md" 
               style={{ backgroundColor: '#FEF9C3', borderColor: '#FDE68A' }}>
            <p className="font-medium" style={{ color: '#92400E' }}>
              Güneş enerjisi çözümleriyle ilgileniyor musunuz?
            </p>
            <LeadTrigger />
          </div>
        )}

        <div className="mt-8 text-right">
          <button
            onClick={() => machine.send({ type: 'PROPOSAL_COMPLETED' })}
            className="text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transform hover:scale-105 transition-all"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Müzakere Sonucuna Git <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <LeadModalsHost customer={customer} />
    </>
  );
};

/*************************** Enhanced Visit Status Selection ***************************/

const VisitStatusSelection: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Müzakere Sonucunu Belirtin</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BasicStatusButton
          colorClass="hover:bg-green-50 hover:border-green-400 hover:shadow-md"
          icon={<CheckCircle className="w-8 h-8 text-green-500" />}
          title="Sözleşme Başlat"
          desc="Müşteri teklifi kabul etti, sürece başla."
          onClick={() => machine.send({ type: 'CONTRACT_START' })}
        />
        <BasicStatusButton
          colorClass="hover:bg-red-50 hover:border-red-400 hover:shadow-md"
          icon={<XCircle className="w-8 h-8 text-red-500" />}
          title="Teklifi Reddetti"
          desc="Müşteri teklifi istemedi."
          onClick={() => machine.send({ type: 'VISIT_REJECTED' })}
        />
        <BasicStatusButton
          colorClass="hover:bg-yellow-50 hover:border-yellow-400 hover:shadow-md"
          icon={<UserX className="w-8 h-8 text-yellow-500" />}
          title="Ulaşılamadı"
          desc="Müşteri adreste bulunamadı."
          onClick={() => machine.send({ type: 'VISIT_UNREACHABLE' })}
        />
        <BasicStatusButton
          colorClass="hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
          icon={<Clock className="w-8 h-8 text-blue-500" />}
          title="Ertelendi"
          desc="Müşteri daha sonra görüşmek istedi."
          onClick={() => machine.send({ type: 'VISIT_POSTPONED' })}
        />
      </div>
      
      <div className="mt-6">
        <label htmlFor="visitNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Ziyaret Notları (Reddetme/Erteleme Sebebi vb.)
        </label>
        <textarea
          id="visitNotes"
          value={machine.context.notes}
          onChange={(e) => machine.updateContext({ notes: e.target.value })}
          rows={3}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Örn: Müşteri mevcut sağlayıcısından memnun olduğunu belirtti."
        />
      </div>
    </div>
  );
};

/*************************** Enhanced Step Components ***************************/

const CustomerInfoStep: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  const { customer } = machine.context;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <IdCard className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
        <h3 className="text-lg font-semibold">1. Müşteri Bilgileri Kontrolü</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Ad Soyad</label>
          <input 
            defaultValue={customer.name} 
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors" 
            readOnly 
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Telefon</label>
          <input 
            defaultValue={customer.phone} 
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors" 
            readOnly 
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 mb-1 block">Adres</label>
          <input
            defaultValue={`${customer.address}, ${customer.district}`}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white transition-colors"
            readOnly
          />
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => machine.send({ type: 'GO_BACK' })}
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
        >
          Geri
        </button>
        <button
          onClick={() => machine.send({ type: 'CUSTOMER_INFO_CONFIRMED' })}
          className="text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-all"
          style={{ backgroundColor: BRAND_COLORS.navy }}
        >
          Bilgiler Doğru, Devam Et <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const IdVerificationStep: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  const [isBypassChecked, setIsBypassChecked] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPlaceholder, setCameraPlaceholder] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    if (stream) stopCamera();
    setCameraError(null);
    setCameraPlaceholder(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      track('camera_start');
    } catch (err: any) {
      setCameraError(`Kamera başlatılamadı: ${err.message}`);
      setCameraPlaceholder(true);
      track('camera_error', { message: err?.message });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCameraPlaceholder(true);
      track('camera_stop');
    }
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl
        .play()
        .catch((error) => {
          console.error('Video oynatma hatası:', error);
          setCameraError('Kamera başlatıldı ancak video otomatik oynatılamadı.');
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const handleCaptureAndOcr = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    
    machine.updateContext({ 
      idPhoto: photoDataUrl, 
      ocrStatus: 'scanning' 
    });
    stopCamera();

    setTimeout(() => {
      machine.updateContext({ 
        ocrStatus: isDev ? 'success' : 'error' 
      });
      track('ocr_mock_success');
    }, 1200);
  };

  const handleNfcRead = () => {
    machine.updateContext({ nfcStatus: 'scanning' });
    setTimeout(() => {
      machine.updateContext({ 
        nfcStatus: isDev ? 'success' : 'error' 
      });
      track('nfc_mock_success');
    }, 900);
  };

  const handleBypassToggle = (isChecked: boolean) => {
    setIsBypassChecked(isChecked);
    if (isChecked) {
      machine.updateContext({ 
        ocrStatus: 'success',
        nfcStatus: 'success'
      });
      stopCamera();
    } else {
      machine.updateContext({ 
        ocrStatus: 'idle',
        nfcStatus: 'idle'
      });
    }
  };

  const isVerified = guards.isIdVerified(machine.context);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <ScanLine className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
          <h3 className="text-lg font-semibold">2. Kimlik Doğrulama</h3>
        </div>
        {isDev && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-300">
            <input
              type="checkbox"
              id="bypass-verification"
              checked={isBypassChecked}
              onChange={(e) => handleBypassToggle(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="bypass-verification" className="text-sm font-medium text-yellow-800">
              [TEST] Doğrulamayı Atla
            </label>
          </div>
        )}
      </div>

      <fieldset disabled={isBypassChecked}>
        <div className={`grid md:grid-cols-2 gap-6 items-start transition-all duration-300 ${
          isBypassChecked ? 'opacity-40 pointer-events-none' : 'opacity-100'
        }`}>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Kimlik Fotoğrafı</p>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {/* Camera Placeholder */}
              {cameraPlaceholder && !machine.context.idPhoto && (
                <div className="flex flex-col items-center gap-3 text-white/80">
                  <Camera className="w-12 h-12" />
                  <p className="text-sm">Kamera başlatılıyor...</p>
                </div>
              )}
              
              <video 
                ref={videoRef} 
                className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`} 
                autoPlay 
                muted 
                playsInline 
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {stream && (
                <div className="absolute inset-0 border-[3px] border-dashed border-white/70 m-4 rounded-xl pointer-events-none animate-pulse" />
              )}
              
              {!stream && machine.context.idPhoto && (
                <img 
                  src={machine.context.idPhoto} 
                  alt="Çekilen Kimlik" 
                  className="w-full h-full object-contain" 
                />
              )}
            </div>
            
            {cameraError && (
              <p className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded border border-red-200">
                {cameraError}
              </p>
            )}
            
            <div className="mt-4">
              {machine.context.ocrStatus === 'idle' && (
                <button
                  onClick={stream ? handleCaptureAndOcr : startCamera}
                  className="w-full text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  <Camera className="w-4 h-4" /> 
                  {stream ? 'Fotoğraf Çek ve Doğrula' : 'Kamerayı Başlat'}
                </button>
              )}
              
              {machine.context.ocrStatus === 'scanning' && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: BRAND_COLORS.navy }} />
                  <p className="mt-2 text-sm font-medium">Kimlik okunuyor...</p>
                </div>
              )}
              
              {machine.context.ocrStatus === 'success' && (
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                  <p className="mt-2 text-green-700 font-semibold">Kimlik başarıyla okundu</p>
                </div>
              )}
              
              {machine.context.ocrStatus === 'error' && (
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto" />
                  <p className="mt-2 text-red-700 font-semibold">Kimlik okunamadı!</p>
                  <p className="text-sm text-red-600 mt-1">
                    Lütfen daha aydınlık bir ortamda, yansıma olmadan tekrar deneyin.
                  </p>
                  <button 
                    onClick={() => machine.updateContext({ ocrStatus: 'idle' })} 
                    className="mt-3 text-sm bg-white px-3 py-2 rounded border hover:bg-gray-50 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NFC Section with glow effect when OCR completes */}
          <div className={`transition-all duration-500 ${
            machine.context.ocrStatus === 'success' 
              ? 'opacity-100 ring-2 ring-yellow-300 ring-opacity-50 shadow-lg' 
              : 'opacity-40 pointer-events-none'
          }`}>
            <p className="text-sm font-medium text-gray-700 mb-2">Çipli Kimlik (NFC) Onayı</p>
            <div className="p-6 border rounded-lg h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-white">
              {machine.context.nfcStatus === 'idle' && (
                <button
                  onClick={handleNfcRead}
                  className="px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all transform hover:scale-105"
                  style={{ backgroundColor: BRAND_COLORS.yellow, color: '#111827' }}
                >
                  <Nfc className="w-5 h-5" /> NFC ile Oku
                </button>
              )}
              
              {machine.context.nfcStatus === 'scanning' && (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: BRAND_COLORS.yellow }} />
                  <p className="mt-3 text-sm font-medium">Telefonu kimliğe yaklaştırın...</p>
                </div>
              )}
              
              {machine.context.nfcStatus === 'success' && (
                <div className="text-center">
                  <ShieldCheck className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="mt-2 text-green-700 font-semibold">NFC onayı başarılı</p>
                </div>
              )}
              
              {machine.context.nfcStatus === 'error' && (
                <div className="text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                  <p className="mt-2 text-red-600 font-semibold">NFC okunamadı</p>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-3 text-center max-w-48">
                Bu adım, kimlikteki çipten bilgileri alarak güvenliği artırır.
              </p>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="mt-6 flex justify-between">
        <button 
          onClick={() => machine.send({ type: 'GO_BACK' })} 
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
        >
          Geri
        </button>
        
        <div className="relative">
          <button
            onClick={() => machine.send({ type: 'ID_VERIFIED' })}
            disabled={!isVerified}
            className={`px-6 py-3 rounded-lg text-white transition-all ${
              isVerified ? 'hover:opacity-90' : 'cursor-not-allowed'
            }`}
            style={{ backgroundColor: isVerified ? BRAND_COLORS.navy : '#9CA3AF' }}
            title={!isVerified ? 'Devam etmek için kimlik ve NFC doğrulaması gerekli' : ''}
          >
            Devam Et
          </button>
          
          {/* Tooltip for disabled state */}
          {!isVerified && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              Devam etmek için kimlik ve NFC doğrulaması gerekli
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContractStep: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  const [flowSmsPhone, setFlowSmsPhone] = useState(() => machine.context.customer?.phone ?? '');
  const [sigOpen, setSigOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  const smsSend = () => {
    machine.updateContext({ smsSent: true });
    track('sms_sent');
  };

  const otpValid = machine.context.smsCode.trim() === '0000' || (isDev && machine.context.smsCode.trim().length >= 4);
  const canContinue = guards.isContractReady(machine.context);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
        <h3 className="text-lg font-semibold">3. Sözleşme Onayı</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Sözleşme Önizleme</p>
          <button
            type="button"
            onClick={() => setContractOpen(true)}
            className="w-full h-64 border rounded-lg bg-white overflow-hidden relative text-left hover:shadow-md transition-all"
            aria-label="Sözleşmeyi görüntüle"
          >
            <ContractMockPage 
              customer={machine.context.customer} 
              signatureDataUrl={machine.context.signatureDataUrl} 
              scale="preview" 
            />
            <div className="absolute bottom-2 right-2 flex flex-col items-center pointer-events-none">
              <div
                className="h-8 w-8 rounded-full text-gray-900 shadow ring-1 ring-black/10 flex items-center justify-center"
                style={{ backgroundColor: BRAND_COLORS.yellow }}
              >
                <Maximize2 className="h-4 w-4" />
              </div>
            </div>
          </button>

          <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={machine.context.contractAccepted}
              onChange={(e) => machine.updateContext({ contractAccepted: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            Sözleşme koşullarını okudum ve onaylıyorum.
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Dijital İmza</p>
          <div className="border rounded-lg p-3 bg-gray-50">
            {machine.context.signatureDataUrl ? (
              <div className="flex items-center gap-3">
                <img 
                  src={machine.context.signatureDataUrl} 
                  alt="İmza" 
                  className="h-[120px] w-auto bg-white rounded border shadow-sm" 
                />
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setSigOpen(true)} 
                    className="px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50 transition-colors"
                  >
                    İmzayı Düzenle
                  </button>
                  <button 
                    onClick={() => machine.updateContext({ signatureDataUrl: null })} 
                    className="px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 py-8">
                <div className="text-sm text-gray-500">Henüz imza alınmadı.</div>
                <button 
                  onClick={() => setSigOpen(true)} 
                  className="px-4 py-2 rounded-lg text-white text-sm hover:opacity-90 transition-all" 
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  İmza Al
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">SMS ile Onay</p>
            <div className="flex gap-2">
              <input
                value={flowSmsPhone}
                onChange={(e) => setFlowSmsPhone(e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="05XX XXX XX XX"
              />
              <button 
                onClick={smsSend} 
                disabled={!phoneIsValid(flowSmsPhone)} 
                className="px-4 py-2 rounded-lg text-gray-900 disabled:bg-gray-300 hover:opacity-90 transition-all" 
                style={{ backgroundColor: BRAND_COLORS.yellow }}
              >
                SMS Gönder
              </button>
            </div>
            
            {machine.context.smsSent && (
              <div className="mt-3 animate-fade-in">
                <div className="flex items-center gap-2 text-green-700 text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" /> Onay SMS'i gönderildi.
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    value={machine.context.smsCode}
                    onChange={(e) => machine.updateContext({ smsCode: e.target.value })}
                    maxLength={6} 
                    className="p-2 border rounded w-32 focus:ring-2 focus:ring-blue-500 transition-all" 
                    placeholder="Onay Kodu" 
                  />
                  <span className={`text-sm transition-colors ${
                    otpValid ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {otpValid ? '✅ Kod doğrulandı' : '0000 demo'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button 
          onClick={() => machine.send({ type: 'GO_BACK' })} 
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
        >
          Geri
        </button>
        
        <div className="relative">
          <button
            onClick={() => machine.send({ type: 'CONTRACT_SIGNED' })}
            disabled={!canContinue}
            className={`px-6 py-3 rounded-lg text-white transition-all ${
              canContinue ? 'hover:opacity-90' : 'cursor-not-allowed'
            }`}
            style={{ backgroundColor: canContinue ? BRAND_COLORS.navy : '#9CA3AF' }}
            title={!canContinue ? 'Devam etmek için imza ve SMS onayı gerekli' : ''}
          >
            Sözleşmeyi Onayla ve Bitir
          </button>
          
          {/* Enhanced tooltip for disabled state */}
          {!canContinue && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none max-w-48 text-center">
              Devam etmek için sözleşme onayı, imza ve SMS doğrulaması gerekli
            </div>
          )}
        </div>
      </div>

      {sigOpen && (
        <SignaturePadModal
          onClose={() => setSigOpen(false)}
          onSave={(dataUrl) => {
            machine.updateContext({ signatureDataUrl: dataUrl });
            setSigOpen(false);
          }}
        />
      )}
      {contractOpen && (
        <ContractModal 
          customer={machine.context.customer} 
          signatureDataUrl={machine.context.signatureDataUrl} 
          onClose={() => setContractOpen(false)} 
        />
      )}
    </div>
  );
};

const CompletionStep: React.FC<{ machine: ReturnType<typeof useStateMachine> }> = ({ machine }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center animate-fade-in">
      <div className="animate-bounce">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">Sözleşme Tamamlandı!</h3>
      <p className="text-gray-600 mb-6">
        Müşteri {machine.context.customer.name} için elektrik satış sözleşmesi başarıyla oluşturulmuştur.
      </p>
      
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => machine.send({ type: 'GO_BACK' })} 
          className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
        >
          Geri
        </button>
        <button 
          onClick={() => machine.send({ type: 'COMPLETION_CONFIRMED' })} 
          className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
        >
          Ziyareti Kaydet
        </button>
      </div>
    </div>
  );
};

/*************************** Supporting Components ***************************/

const BasicStatusButton: React.FC<{
  colorClass: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}> = ({ colorClass, icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className={`p-6 border rounded-xl text-left transition-all duration-200 flex items-center gap-4 transform hover:scale-105 ${colorClass}`}
  >
    {icon}
    <div>
      <p className="font-semibold text-lg">{title}</p>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
    </div>
  </button>
);

/*************************** Lead Modal Components ***************************/

const LeadGenerationModal: React.FC<{ customer: Customer; onClose: () => void }> = ({ customer, onClose }) => {
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>([]);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSolutionToggle = (solution: string) =>
    setSelectedSolutions((prev) => (prev.includes(solution) ? prev.filter((s) => s !== solution) : [...prev, solution]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track('lead_submit', { customerId: customer.id, solutions: selectedSolutions, kvkk: kvkkAccepted });
    setIsSubmitted(true);
    setTimeout(onClose, 1500);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Kapat">
          <XCircle className="w-6 h-6" />
        </button>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-2">Güneş Enerjisi Çözümleri Talep Formu</h3>
            <p className="text-sm text-gray-600 mb-4">Müşterinin ilgilendiği çözümleri işaretleyin.</p>
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-gray-700">{customer.phone}</p>
            </div>
            <div className="mb-4">
              <label className="font-medium">Talep Edilen Çözümler:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {['Güneş Paneli', 'Depolama (Batarya)', 'Şarj İstasyonu (EV)'].map((sol) => (
                  <label
                    key={sol}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedSolutions.includes(sol) ? 'bg-yellow-100 border-yellow-400' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSolutions.includes(sol)}
                      onChange={() => handleSolutionToggle(sol)}
                      className="h-4 w-4 rounded text-yellow-500 focus:ring-yellow-400"
                    />
                    {sol}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                />
                <span>
                  KVKK aydınlatma metnini okudum, anladım. Müşterinin verilerinin bu talep kapsamında işlenmesine ve
                  kendisiyle iletişime geçilmesine onay verdiğini beyan ederim.
                </span>
              </label>
            </div>
            <button
              type="submit"
              disabled={!kvkkAccepted || selectedSolutions.length === 0}
              className="w-full text-gray-900 px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              style={{ backgroundColor: BRAND_COLORS.yellow }}
            >
              Talep Oluştur
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-semibold">Talep Alındı!</h3>
            <p className="text-gray-600 mt-2">Müşteriniz en kısa sürede uzman ekibimiz tarafından aranacaktır.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LeadModalBus: { open: (() => void)[] } = { open: [] };

const LeadTrigger: React.FC = () => {
  return (
    <button
      onClick={() => LeadModalBus.open.forEach((f) => f())}
      className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
      style={{ backgroundColor: BRAND_COLORS.yellow, color: '#111827' }}
    >
      Evet, Teklif İçin Talep Oluştur
    </button>
  );
};

const LeadModalsHost: React.FC<{ customer: Customer }> = ({ customer }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setOpen(true);
    LeadModalBus.open.push(fn);
    return () => {
      const i = LeadModalBus.open.indexOf(fn);
      if (i >= 0) LeadModalBus.open.splice(i, 1);
    };
  }, []);
  if (!open) return null;
  return <LeadGenerationModal customer={customer} onClose={() => setOpen(false)} />;
};

/*************************** Signature Modal ***************************/

const SignaturePadModal: React.FC<{ onClose: () => void; onSave: (dataUrl: string) => void }> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const fitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    return () => window.removeEventListener('resize', fitCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;
    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    };
    const up = () => {
      drawing = false;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', up);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[10050] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">İmza</div>
        <div className="flex gap-2">
          <button onClick={handleClear} className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50 transition-colors">
            Temizle
          </button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded text-white text-sm hover:opacity-90 transition-all" style={{ backgroundColor: BRAND_COLORS.navy }}>
            Kaydet
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50 transition-colors">
            Kapat
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <canvas ref={canvasRef} className="h-full w-full" style={{ touchAction: 'none' }} />
      </div>
    </div>
  );
};

/*************************** Contract Components ***************************/

const ContractMockPage: React.FC<{ 
  customer: Customer; 
  signatureDataUrl: string | null; 
  scale: 'preview' | 'full' 
}> = ({ customer, signatureDataUrl, scale }) => {
  const base = scale === 'full'
    ? { pad: 'p-8', title: 'text-2xl', body: 'text-sm', small: 'text-xs' }
    : { pad: 'p-3', title: 'text-base', body: 'text-[10.5px]', small: 'text-[9.5px]' };
  const sigH = scale === 'full' ? 100 : 44;
  const imgMaxH = Math.floor(sigH * 0.8);

  return (
    <div className={`relative h-full w-full ${base.pad} bg-white`}>
      <div className="text-center mb-2">
        <div className={`font-semibold ${base.title} text-gray-900`}>ELEKTRİK SATIŞ SÖZLEŞMESİ</div>
        <div className={`${base.small} text-gray-500`}>Mock • Tek Sayfa</div>
      </div>
      <div className={`space-y-2 ${base.body} text-gray-800`}>
        <p>
          İşbu sözleşme; <strong>{customer.name}</strong> ({customer.address}, {customer.district}) ile Enerjisa Satış A.Ş. arasında,
          elektrik tedariki kapsamındaki hak ve yükümlülükleri belirlemek üzere {new Date().toLocaleDateString()} tarihinde akdedilmiştir.
        </p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Teslim noktasında ölçüm değerleri esas alınır.</li>
          <li>Faturalandırma aylık dönemler itibarıyla yapılır.</li>
          <li>Ödeme süresi fatura tebliğinden itibaren 10 gündür.</li>
        </ol>
      </div>
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}>
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Müşteri İmzası" style={{ maxHeight: imgMaxH, maxWidth: '90%' }} className="object-contain" />
              ) : (
                <span className={`${base.small} text-gray-400`}>Müşteri İmzası</span>
              )}
            </div>
            <div className={`${base.small} mt-1 text-gray-500 text-center`}>Müşteri İmzası</div>
          </div>
          <div className="flex flex-col">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white flex items-center justify-center" style={{ height: sigH }}>
              <span className={`${base.small} text-gray-400`}>Tedarikçi İmzası</span>
            </div>
            <div className={`${base.small} mt-1 text-gray-500 text-center`}>Tedarikçi İmzası</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContractModal: React.FC<{ 
  customer: Customer; 
  signatureDataUrl: string | null; 
  onClose: () => void 
}> = ({ customer, signatureDataUrl, onClose }) => {
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-[10040] flex flex-col bg-black/50">
      <div className="flex items-center justify-between bg-white px-4 py-3 border-b">
        <div className="font-semibold text-gray-900">Sözleşme — Önizleme</div>
        <button onClick={onClose} className="px-3 py-1.5 rounded border bg-white text-sm hover:bg-gray-50 transition-colors">
          Kapat
        </button>
      </div>
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="mx-auto my-4 bg-white shadow border" style={{ width: 820, minHeight: 1160 }}>
          <ContractMockPage customer={customer} signatureDataUrl={signatureDataUrl} scale="full" />
        </div>
      </div>
    </div>
  );
};

export default VisitFlowScreen;