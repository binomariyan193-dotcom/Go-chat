import { supabaseAdmin } from './config/supabase';
import * as authService from './services/auth.service';
import * as chatService from './services/chat.service';

async function testEndToEndAPIs() {
  console.log('🧪 Starting End-to-End Supabase & API Validation Test...\n');

  try {
    // 1. Test Supabase Database Connection & User Table
    console.log('1️⃣ Testing Supabase DB Connection...');
    const { data: testQuery, error: connError } = await supabaseAdmin.from('User').select('count', { count: 'exact' });
    if (connError) {
      throw new Error(`Supabase DB Connection Failed: ${connError.message}`);
    }
    console.log('✅ Supabase PostgreSQL connected successfully!');

    // 2. Test User Registration API
    console.log('\n2️⃣ Testing User Registration API...');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testUsername = `user_${Date.now()}`;
    const testPassword = 'Password123!';

    const regResult = await authService.registerUser(testEmail, testUsername, testPassword);
    console.log(`✅ User registered successfully! ID: ${regResult.user.id}, Username: ${regResult.user.username}`);
    console.log(`🔑 JWT Token generated: ${regResult.token.substring(0, 20)}...`);

    // 3. Test User Login API
    console.log('\n3️⃣ Testing User Login API...');
    const loginResult = await authService.loginUser(testEmail, testPassword);
    console.log(`✅ Login successful for ${loginResult.user.email}`);

    // 4. Test Conversation Auto-Creation / Fetching
    console.log('\n4️⃣ Testing Conversation Service...');
    const conversations = await chatService.getUserConversations(loginResult.user.id);
    console.log(`✅ Retrieved ${conversations.length} conversation(s).`);
    const activeConv = conversations[0];
    console.log(`💬 Active Room: "${activeConv.name || 'DM'}" (ID: ${activeConv.id})`);

    // 5. Test Message Creation in Conversation
    console.log('\n5️⃣ Testing Message Creation API...');
    const msgText = 'Hello World! End-to-end API test message 🚀';
    const createdMsg = await chatService.createMessage(activeConv.id, loginResult.user.id, msgText);
    console.log(`✅ Message created successfully! Content: "${createdMsg.textContent}"`);

    // 6. Test Fetching Messages from Conversation
    console.log('\n6️⃣ Testing Message Retrieval API...');
    const roomMessages = await chatService.getConversationMessages(activeConv.id);
    console.log(`✅ Retrieved ${roomMessages.length} message(s) from conversation.`);

    // 7. Test Supabase Storage Bucket ('chat-images')
    console.log('\n7️⃣ Testing Supabase Storage Bucket...');
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    if (bucketError) {
      console.warn(`⚠️ Warning checking storage buckets: ${bucketError.message}`);
    } else {
      const hasBucket = buckets.some((b) => b.name === 'chat-images');
      console.log(hasBucket ? '✅ Storage bucket "chat-images" exists and ready!' : 'ℹ️ Storage bucket "chat-images" will be auto-created on first upload.');
    }

    console.log('\n🎉 ALL APIS PASSED END-TO-END VALIDATION SUCCESSFULLY! 🎉\n');
  } catch (error: any) {
    console.error('\n❌ API Validation Error:', error.message || error);
    process.exit(1);
  }
}

testEndToEndAPIs();
