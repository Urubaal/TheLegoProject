-- Migration: Add photo_url fields to collection tables
-- This migration adds photo_url field to all collection tables for image support

-- Add photo_url to user_owned_sets
ALTER TABLE user_owned_sets 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add photo_url to user_owned_minifigs  
ALTER TABLE user_owned_minifigs 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add photo_url to user_wanted_sets
ALTER TABLE user_wanted_sets 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add photo_url to user_wanted_minifigs
ALTER TABLE user_wanted_minifigs 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add indexes for photo_url fields for better performance
CREATE INDEX IF NOT EXISTS idx_owned_sets_photo_url ON user_owned_sets(photo_url) WHERE photo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_owned_minifigs_photo_url ON user_owned_minifigs(photo_url) WHERE photo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wanted_sets_photo_url ON user_wanted_sets(photo_url) WHERE photo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wanted_minifigs_photo_url ON user_wanted_minifigs(photo_url) WHERE photo_url IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_owned_sets.photo_url IS 'URL to photo of the owned set';
COMMENT ON COLUMN user_owned_minifigs.photo_url IS 'URL to photo of the owned minifig';
COMMENT ON COLUMN user_wanted_sets.photo_url IS 'URL to photo of the wanted set';
COMMENT ON COLUMN user_wanted_minifigs.photo_url IS 'URL to photo of the wanted minifig';
