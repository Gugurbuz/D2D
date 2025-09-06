import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentSalesRep } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type SalesRep = Database['public']['Tables']['sales_reps']['Row'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSalesRep();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadSalesRep();
        } else {
          setSalesRep(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadSalesRep = async () => {
    try {
      const { data, error } = await getCurrentSalesRep();
      if (error) {
        console.error('Error loading sales rep:', error);
      } else {
        setSalesRep(data);
      }
    } catch (error) {
      console.error('Error loading sales rep:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    salesRep,
    loading,
    isManager: salesRep?.role === 'manager',
    isSalesRep: salesRep?.role === 'sales_rep',
  };
}