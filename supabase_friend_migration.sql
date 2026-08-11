-- =============================================================================
-- FRIEND REQUEST SYSTEM MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS "FriendRequest" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "senderId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "receiverId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" TEXT DEFAULT 'pending', -- pending, accepted, rejected
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "unique_friend_request" UNIQUE("senderId", "receiverId")
);

CREATE INDEX IF NOT EXISTS "idx_friend_req_receiver" ON "FriendRequest"("receiverId");
CREATE INDEX IF NOT EXISTS "idx_friend_req_sender" ON "FriendRequest"("senderId");

DROP TRIGGER IF EXISTS update_friend_req_updated_at ON "FriendRequest";
CREATE TRIGGER update_friend_req_updated_at
BEFORE UPDATE ON "FriendRequest"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
