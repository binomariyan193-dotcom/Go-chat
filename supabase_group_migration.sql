-- =============================================================================
-- SUPABASE MIGRATION: Custom Group Chat Management & Admin Roles
-- Copy and paste this into your Supabase Dashboard -> SQL Editor and click "RUN"
-- =============================================================================

-- 1. Add description and avatarUrl to Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- 2. Add role column to ConversationMember table
ALTER TABLE "ConversationMember" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'member';
