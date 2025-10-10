import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Visit = Database['public']['Tables']['visits']['Row'];
type VisitInsert = Database['public']['Tables']['visits']['Insert'];
type VisitUpdate = Database['public']['Tables']['visits']['Update'];

export const visitService = {
  // Get all visits for current user
  async getVisits(filters?: {
    status?: string;
    date?: string;
    customerId?: string;
  }) {
    let query = supabase
      .from('visits')
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
          phone
        )
      `)
      .order('visit_date', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.date) {
      query = query.eq('visit_date', filters.date);
    }

    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Get today's visits
  async getTodaysVisits() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('visits')
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
      .eq('visit_date', today)
      .order('planned_time', { ascending: true });

    return { data, error };
  },

  // Create new visit
  async createVisit(visit: VisitInsert) {
    const { data, error } = await supabase
      .from('visits')
      .insert(visit)
      .select(`
        *,
        customers(
          id,
          name,
          address,
          district,
          phone
        )
      `)
      .single();

    return { data, error };
  },

  // Update visit
  async updateVisit(id: string, updates: VisitUpdate) {
    const { data, error } = await supabase
      .from('visits')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        customers(
          id,
          name,
          address,
          district,
          phone
        )
      `)
      .single();

    return { data, error };
  },

  // Start visit (update status and start time)
  async startVisit(id: string) {
    const { data, error } = await supabase
      .from('visits')
      .update({
        status: 'in_progress',
        actual_start_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Complete visit
  async completeVisit(id: string, result: string, notes?: string, contractSigned?: boolean, revenueAmount?: number) {
    const { data, error } = await supabase
      .from('visits')
      .update({
        status: 'completed',
        actual_end_time: new Date().toISOString(),
        result,
        notes,
        contract_signed: contractSigned || false,
        revenue_amount: revenueAmount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Get visit statistics
  async getVisitStats(dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('visits')
      .select('status, result, revenue_amount, contract_signed');

    if (dateFrom) {
      query = query.gte('visit_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('visit_date', dateTo);
    }

    const { data, error } = await query;

    if (error) return { data: null, error };

    // Calculate statistics
    const stats = {
      total: data.length,
      completed: data.filter(v => v.status === 'completed').length,
      inProgress: data.filter(v => v.status === 'in_progress').length,
      planned: data.filter(v => v.status === 'planned').length,
      cancelled: data.filter(v => v.status === 'cancelled').length,
      contractsSigned: data.filter(v => v.contract_signed).length,
      totalRevenue: data.reduce((sum, v) => sum + (v.revenue_amount || 0), 0),
      conversionRate: data.length > 0 ? (data.filter(v => v.contract_signed).length / data.length) * 100 : 0
    };

    return { data: stats, error: null };
  },

  // Upsert visit draft (auto-save)
  async upsertVisitDraft(visit: VisitInsert & { id?: string; last_step?: string }) {
    const { id, last_step, ...visitData } = visit;

    if (id) {
      const { data, error } = await supabase
        .from('visits')
        .update({
          ...visitData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('visits')
        .insert({
          ...visitData,
          status: 'in_progress',
        })
        .select()
        .maybeSingle();

      return { data, error };
    }
  },
};