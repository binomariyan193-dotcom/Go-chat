import { supabaseAdmin } from './config/supabase';

async function initFriendTable() {
  console.log('🔄 Checking FriendRequest table status in Supabase...');

  const { data, error } = await supabaseAdmin.from('FriendRequest').select('count', { count: 'exact' });

  if (error && error.message.includes('does not exist')) {
    console.log('⚠️ FriendRequest table is not created yet in Supabase.');
    console.log('👉 Please execute the SQL script in "supabase_friend_migration.sql" in your Supabase SQL Editor.');
  } else {
    console.log('✅ FriendRequest table is active and accessible!');
  }
}

initFriendTable();
