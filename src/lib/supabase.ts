import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Auth helpers
export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    throw new Error('Supabase bağlantısı kurulmamış. Lütfen önce "Connect to Supabase" butonuna tıklayın.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, userData: {
  name: string;
  phone?: string;
  role: 'sales_rep' | 'manager';
}) => {
  if (!supabase) {
    throw new Error('Supabase bağlantısı kurulmamış. Lütfen önce "Connect to Supabase" butonuna tıklayın.');
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!supabase) {
    return { user: null, error: { message: 'Supabase not configured' } };
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getCurrentSalesRep = async () => {
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  const { data, error } = await supabase
    .from('sales_reps')
    .select('*')
    .single();
  return { data, error };
};