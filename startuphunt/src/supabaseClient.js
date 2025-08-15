// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
    VITE_SUPABASE_ANON_KEY: supabaseKey ? '✅ Set' : '❌ Missing'
  });

  if (import.meta.env.PROD) {
    throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey);
