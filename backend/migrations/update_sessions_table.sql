-- Migration: Update user_sessions table structure
-- Date: 2025-09-30
-- Purpose: Add security fields to existing user_sessions table

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add session_token column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'session_token') THEN
    ALTER TABLE user_sessions ADD COLUMN session_token VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;
  END IF;

  -- Add user_agent column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'user_agent') THEN
    ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;
  END IF;

  -- Add ip_address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'ip_address') THEN
    ALTER TABLE user_sessions ADD COLUMN ip_address VARCHAR(45);
  END IF;

  -- Add device_fingerprint column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'device_fingerprint') THEN
    ALTER TABLE user_sessions ADD COLUMN device_fingerprint TEXT;
  END IF;

  -- Add remember_me column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'remember_me') THEN
    ALTER TABLE user_sessions ADD COLUMN remember_me BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add expires_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'expires_at') THEN
    ALTER TABLE user_sessions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '24 hours';
  END IF;

  -- Add is_active column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = 'is_active') THEN
    ALTER TABLE user_sessions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;

-- Remove old DEFAULT after adding column
ALTER TABLE user_sessions ALTER COLUMN session_token DROP DEFAULT;
