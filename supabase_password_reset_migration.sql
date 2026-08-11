-- =============================================================================
-- PASSWORD RESET TABLE MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS "PasswordReset" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "used" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_password_reset_user" ON "PasswordReset"("userId");
CREATE INDEX IF NOT EXISTS "idx_password_reset_otp" ON "PasswordReset"("otp");
