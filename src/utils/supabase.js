// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Add error checking for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
    });
    throw new Error('Missing required Supabase configuration. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Export individual values for debugging if needed
export const debug = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    // Don't log the actual values in production
    urlPrefix: supabaseUrl?.substring(0, 8),
    keyPrefix: supabaseAnonKey?.substring(0, 8)
};