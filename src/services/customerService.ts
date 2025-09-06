import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export const customerService = {
  // Get all customers (respects RLS)
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        assignments!inner(
          sales_rep_id,
          sales_reps(name, phone)
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Get customer by ID
  async getCustomer(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        assignments(
          sales_rep_id,
          sales_reps(name, phone)
        ),
        visits(
          id,
          visit_date,
          status,
          result,
          notes
        )
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Create new customer
  async createCustomer(customer: CustomerInsert) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    return { data, error };
  },

  // Update customer
  async updateCustomer(id: string, updates: CustomerUpdate) {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Delete customer
  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    return { error };
  },

  // Search customers
  async searchCustomers(query: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%,customer_number.ilike.%${query}%`)
      .order('name');

    return { data, error };
  },

  // Get customers by district
  async getCustomersByDistrict(district: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('district', district)
      .order('name');

    return { data, error };
  }
};