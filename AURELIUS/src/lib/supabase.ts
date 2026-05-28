import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sztdmzrdyswgltijxqgf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
