// חיבור Supabase — המפתחות מגיעים מ-Environment Variables ב-Vercel בלבד
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
