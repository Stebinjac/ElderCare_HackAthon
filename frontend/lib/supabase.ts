import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a single supabase client for interacting with your database.
// Note: In the browser, this requires NEXT_PUBLIC_SUPABASE_ANON_KEY to be set in .env.local
export const supabase = createClient(supabaseUrl, supabaseKey || 'MISSING_KEY');
