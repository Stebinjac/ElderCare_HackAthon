import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a single supabase client for interacting with your database
// We use the service_role key here to bypass RLS in our backend API routes
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
