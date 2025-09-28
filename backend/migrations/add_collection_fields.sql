-- Migration: Add new fields to user_owned_sets table
-- This migration adds the new fields for enhanced collection management

-- Add new fields to user_owned_sets table
ALTER TABLE user_owned_sets 
ADD COLUMN purchase_date DATE,
ADD COLUMN has_minifigures BOOLEAN DEFAULT false,
ADD COLUMN has_instructions BOOLEAN DEFAULT false,
ADD COLUMN has_box BOOLEAN DEFAULT false,
ADD COLUMN has_building_blocks BOOLEAN DEFAULT false;

-- Update condition_status constraint to include 'factory_sealed'
ALTER TABLE user_owned_sets 
DROP CONSTRAINT IF EXISTS user_owned_sets_condition_status_check;

ALTER TABLE user_owned_sets 
ADD CONSTRAINT user_owned_sets_condition_status_check 
CHECK (condition_status IN ('factory_sealed', 'new', 'used'));

-- Add similar fields to user_owned_minifigs for consistency
ALTER TABLE user_owned_minifigs 
ADD COLUMN purchase_date DATE,
ADD COLUMN has_instructions BOOLEAN DEFAULT false,
ADD COLUMN has_box BOOLEAN DEFAULT false;

-- Update condition_status constraint for minifigs
ALTER TABLE user_owned_minifigs 
DROP CONSTRAINT IF EXISTS user_owned_minifigs_condition_status_check;

ALTER TABLE user_owned_minifigs 
ADD CONSTRAINT user_owned_minifigs_condition_status_check 
CHECK (condition_status IN ('factory_sealed', 'new', 'used'));

-- Add indexes for new fields
CREATE INDEX idx_owned_sets_purchase_date ON user_owned_sets(purchase_date);
CREATE INDEX idx_owned_sets_has_minifigures ON user_owned_sets(has_minifigures);
CREATE INDEX idx_owned_sets_has_instructions ON user_owned_sets(has_instructions);
CREATE INDEX idx_owned_sets_has_box ON user_owned_sets(has_box);
CREATE INDEX idx_owned_sets_has_building_blocks ON user_owned_sets(has_building_blocks);

CREATE INDEX idx_owned_minifigs_purchase_date ON user_owned_minifigs(purchase_date);
CREATE INDEX idx_owned_minifigs_has_instructions ON user_owned_minifigs(has_instructions);
CREATE INDEX idx_owned_minifigs_has_box ON user_owned_minifigs(has_box);
