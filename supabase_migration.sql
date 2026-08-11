-- =============================================================================
-- SUPABASE COMPLETE DATABASE MIGRATION SCRIPT
-- Copy and paste this into your Supabase Dashboard -> SQL Editor and click "RUN"
-- =============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "username" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "status" TEXT DEFAULT 'offline',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Conversation Table
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT,
    "isGroup" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create ConversationMember (Junction Table)
CREATE TABLE IF NOT EXISTS "ConversationMember" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "unique_conversation_user" UNIQUE("conversationId", "userId")
);

-- 5. Create Message Table
CREATE TABLE IF NOT EXISTS "Message" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "senderId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "textContent" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS "idx_conversation_member_user" ON "ConversationMember"("userId");
CREATE INDEX IF NOT EXISTS "idx_conversation_member_conv" ON "ConversationMember"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_message_conversation" ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_message_created_at" ON "Message"("createdAt");

-- 7. Initialize Supabase Storage Bucket for Chat Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage Access Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access for Chat Images'
    ) THEN
        CREATE POLICY "Public Read Access for Chat Images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'chat-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow Image Uploads to Chat Images'
    ) THEN
        CREATE POLICY "Allow Image Uploads to Chat Images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'chat-images');
    END IF;
END $$;

-- 9. Automatic Timestamp Trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_conversation_updated_at ON "Conversation";
CREATE TRIGGER update_conversation_updated_at
BEFORE UPDATE ON "Conversation"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
