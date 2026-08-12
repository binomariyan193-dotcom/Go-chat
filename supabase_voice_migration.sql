-- Migration Script: Add audioUrl column to Message table for Voice Notes
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
