-- Migration Script: Create MessageReaction table for Emoji Reactions
CREATE TABLE IF NOT EXISTS "MessageReaction" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "messageId" UUID NOT NULL REFERENCES "Message"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT "unique_message_user_emoji" UNIQUE ("messageId", "userId", "emoji")
);

-- Index for high performance queries
CREATE INDEX IF NOT EXISTS "idx_message_reaction_messageId" ON "MessageReaction"("messageId");
