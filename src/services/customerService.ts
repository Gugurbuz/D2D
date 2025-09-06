import { supabase } from '../lib/supabase';
import { Customer } from '../types';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        // Return mock data as fallback
        return getMockCustomers();
      }

      return data || [];
    } catch (error) {
      console.error('Error in customerService.getCustomers:', error);
      return getMockCustomers();
    }
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in customerService.getCustomerById:', error);
      return null;
    }
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in customerService.createCustomer:', error);
      return null;
    }
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in customerService.updateCustomer:', error);
      return null;
    }
  }
};

// Mock data fallback
function getMockCustomers(): Customer[] {
  return [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      address: 'Kadıköy Mah. Bağdat Cad. No:123',
      district: 'Kadıköy',
      phone: '0532 123 45 67',
      email: 'ahmet.yilmaz@email.com',
      customer_number: 'C001',
      installation_number: 'I001',
      meter_number: 'M001',
      location: { lat: 40.9903, lng: 29.0275 },
      customer_type: 'residential',
      tariff: 'Ev Tarife',
      current_supplier: 'BEDAŞ',
      avg_consumption: 250,
      annual_consumption: 3000,
      is_free_consumer: true,
      offer_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}