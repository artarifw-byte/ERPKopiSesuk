import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client = null;
let configurationError = '';

if (!supabaseUrl || !supabaseAnonKey) {
  configurationError = 'Konfigurasi layanan belum lengkap. Administrator perlu mengatur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Netlify, lalu melakukan deploy ulang.';
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    configurationError = 'Konfigurasi layanan tidak valid. Administrator perlu memeriksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Netlify, lalu melakukan deploy ulang.';
  }
}

export const supabase = client;
export const supabaseConfigurationError = configurationError;
