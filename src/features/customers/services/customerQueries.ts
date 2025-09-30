import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../../services/customerService';
import { Customer } from '../types';

export const CUSTOMER_KEYS = {
  all: ['customers'] as const,
  lists: () => [...CUSTOMER_KEYS.all, 'list'] as const,
  list: (filters: string) => [...CUSTOMER_KEYS.lists(), filters] as const,
  details: () => [...CUSTOMER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CUSTOMER_KEYS.details(), id] as const,
};

export function useCustomersQuery(isDemoMode: boolean = false) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.lists(),
    queryFn: () => customerService.getCustomers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: () => customerService.getCustomerById(id),
    enabled: !!id,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Customer> }) => 
      customerService.updateCustomer(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
    },
  });
}