-- Add End-to-End Encryption (E2EE) Columns

-- 1. Add RSA Public Key column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "publicKey" TEXT;

-- 2. Add Encrypted Conversation Key column to ConversationMember table
ALTER TABLE "ConversationMember" 
ADD COLUMN IF NOT EXISTS "encryptedKey" TEXT;

-- 3. Add Encryption fields to Message table
ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS "isEncrypted" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "ciphertext" TEXT,
ADD COLUMN IF NOT EXISTS "iv" TEXT;
