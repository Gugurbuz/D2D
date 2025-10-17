import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];

export const assignmentService = {
  // Get all assignments
  async getAssignments() {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        customers(
          id,
          name,
          address,
          district,
          phone,
          customer_type
        ),
        sales_reps(
          id,
          name,
          phone,
          district
        )
      `)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    return { data, error };
  },

  // Assign customer to sales rep
  async assignCustomer(customerId: string, salesRepId: string) {
    // First, deactivate any existing assignments for this customer
    await supabase
      .from('assignments')
      .update({ is_active: false })
      .eq('customer_id', customerId);

    // Create new assignment
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        customer_id: customerId,
        sales_rep_id: salesRepId,
        is_active: true
      })
      .select(`
        *,
        customers(
          id,
          name,
          address,
          district
        ),
        sales_reps(
          id,
          name
        )
      `)
      .single();

    return { data, error };
  },

  // Assign multiple customers to a sales rep
  async assignMultipleCustomers(customerIds: string[], salesRepId: string) {
    // First, deactivate existing assignments for these customers
    await supabase
      .from('assignments')
      .update({ is_active: false })
      .in('customer_id', customerIds);

    // Create new assignments
    const assignments: AssignmentInsert[] = customerIds.map(customerId => ({
      customer_id: customerId,
      sales_rep_id: salesRepId,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('assignments')
      .insert(assignments)
      .select(`
        *,
        customers(
          id,
          name,
          address,
          district
        ),
        sales_reps(
          id,
          name
        )
      `);

    return { data, error };
  },

  // Remove assignment
  async removeAssignment(customerId: string) {
    const { error } = await supabase
      .from('assignments')
      .update({ is_active: false })
      .eq('customer_id', customerId);

    return { error };
  },

  // Get assignments for a specific sales rep
  async getAssignmentsForRep(salesRepId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        customers(
          id,
          name,
          address,
          district,
          phone,
          customer_type,
          location
        )
      `)
      .eq('sales_rep_id', salesRepId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    return { data, error };
  },

  // Get assignment statistics
  async getAssignmentStats() {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        sales_rep_id,
        sales_reps(name),
        customer_id
      `)
      .eq('is_active', true);

    if (error) return { data: null, error };

    // Group by sales rep
    const stats = data.reduce((acc, assignment) => {
      const repId = assignment.sales_rep_id;
      const repName = assignment.sales_reps?.name || 'Unknown';
      
      if (!acc[repId]) {
        acc[repId] = {
          repId,
          repName,
          customerCount: 0
        };
      }
      
      acc[repId].customerCount++;
      return acc;
    }, {} as Record<string, { repId: string; repName: string; customerCount: number }>);

    return { data: Object.values(stats), error: null };
  }
};