-- Migration: Create sessions table for storing user sessions
-- Created: 2025-09-30
-- Purpose: Replace localStorage with database-backed secure sessions

-- Create sessions table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip_address VARCHAR(45), -- IPv6 support
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Additional security fields
    device_fingerprint TEXT,
    remember_me BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    CONSTRAINT unique_active_session UNIQUE (session_token, is_active)
);

-- Create indexes for fast lookups (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;

-- Create function to automatically cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_activity on session access
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    WHEN (OLD.last_activity IS DISTINCT FROM NEW.last_activity)
    EXECUTE FUNCTION update_session_activity();

-- Add comments for documentation
COMMENT ON TABLE user_sessions IS 'Stores user authentication sessions with security metadata';
COMMENT ON COLUMN user_sessions.session_token IS 'Cryptographically secure session token (to be used in httpOnly cookie)';
COMMENT ON COLUMN user_sessions.user_agent IS 'Browser user agent for session validation';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address where session was created';
COMMENT ON COLUMN user_sessions.device_fingerprint IS 'Browser fingerprint for additional security';
COMMENT ON COLUMN user_sessions.remember_me IS 'If true, session expires in 30 days instead of 24 hours';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO lego_user;
GRANT USAGE, SELECT ON SEQUENCE user_sessions_id_seq TO lego_user;
