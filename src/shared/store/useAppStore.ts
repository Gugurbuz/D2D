import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Customer } from '../../features/customers/types';
import { AuthUser } from '../../features/auth/types';
import { Screen } from '../types';

interface AppState {
  // Navigation
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  
  // Selected entities
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  
  // Assignments
  assignments: Record<string, string | undefined>;
  setAssignments: (assignments: Record<string, string | undefined>) => void;
  assignCustomer: (customerId: string, repId: string) => void;
  unassignCustomer: (customerId: string) => void;
  
  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Filters (persisted)
  customerFilters: {
    search: string;
    status: string;
    priority: string;
    district: string;
  };
  setCustomerFilters: (filters: Partial<AppState['customerFilters']>) => void;
  
  // Reset function
  reset: () => void;
}

const initialState = {
  currentScreen: 'dashboard' as Screen,
  selectedCustomer: null,
  assignments: {},
  sidebarCollapsed: false,
  customerFilters: {
    search: '',
    status: 'Tümü',
    priority: 'Tümü',
    district: 'Tümü',
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setCurrentScreen: (screen) => set({ currentScreen: screen }),
        
        setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
        
        setAssignments: (assignments) => set({ assignments }),
        
        assignCustomer: (customerId, repId) => set((state) => ({
          assignments: { ...state.assignments, [customerId]: repId }
        })),
        
        unassignCustomer: (customerId) => set((state) => {
          const newAssignments = { ...state.assignments };
          delete newAssignments[customerId];
          return { assignments: newAssignments };
        }),
        
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        setCustomerFilters: (filters) => set((state) => ({
          customerFilters: { ...state.customerFilters, ...filters }
        })),
        
        reset: () => set(initialState),
      }),
      {
        name: 'enerjisa-app-store',
        partialize: (state) => ({
          assignments: state.assignments,
          sidebarCollapsed: state.sidebarCollapsed,
          customerFilters: state.customerFilters,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);