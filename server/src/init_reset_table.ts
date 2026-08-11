import { supabaseAdmin } from './config/supabase';

async function checkResetTable() {
  console.log('🔄 Checking PasswordReset table status in Supabase...');

  const { data, error } = await supabaseAdmin.from('PasswordReset').select('count', { count: 'exact' });

  if (error && error.message.includes('does not exist')) {
    console.log('⚠️ PasswordReset table is not created yet in Supabase.');
    console.log('👉 Please execute the SQL script in "supabase_password_reset_migration.sql" in your Supabase SQL Editor.');
  } else {
    console.log('✅ PasswordReset table is active and ready!');
  }
}

checkResetTable();
