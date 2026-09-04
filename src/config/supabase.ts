/**
 * TARAS 2K26 — Supabase Client Configuration
 *
 * Exclusively used as a file-storage provider for payment-proof screenshots.
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * - Only the public/anon key (VITE_SUPABASE_ANON_KEY) is used here.
 * - NEVER include or expose SUPABASE_SERVICE_ROLE_KEY in frontend code or .env exposed to Vite.
 * - Firebase Authentication remains the sole identity provider.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify that no service role key was mistakenly configured in client environment
if (
  typeof window !== 'undefined' &&
  (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    (supabaseAnonKey && supabaseAnonKey.includes('service_role')))
) {
  console.error(
    'CRITICAL SECURITY VIOLATION: SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed in client code!'
  );
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
} else {
  console.warn(
    'TARAS 2K26: Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not yet fully configured in .env.local.'
  );
}

export const supabase = supabaseInstance as SupabaseClient;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase Storage is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.'
    );
  }
  return supabaseInstance;
}
