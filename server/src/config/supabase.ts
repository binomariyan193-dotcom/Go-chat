import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Supabase credentials missing from environment variables.');
}

// Service role client for server-side admin ops (e.g. uploading images to storage)
export const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY
);
