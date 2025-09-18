-- Quick fix to add missing columns for market creation
-- Run this in your Supabase SQL editor to fix the immediate error

-- Add the missing columns that are causing the error
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS resolution_criteria TEXT,
ADD COLUMN IF NOT EXISTS data_sources TEXT,
ADD COLUMN IF NOT EXISTS edge_cases TEXT,
ADD COLUMN IF NOT EXISTS dispute_resolution TEXT,
ADD COLUMN IF NOT EXISTS market_context TEXT,
ADD COLUMN IF NOT EXISTS token_context TEXT,
ADD COLUMN IF NOT EXISTS historical_context TEXT,
ADD COLUMN IF NOT EXISTS liquidity_context TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS question_type_detailed TEXT,
ADD COLUMN IF NOT EXISTS resolution TEXT CHECK (resolution IN ('yes', 'no', 'disputed')),
ADD COLUMN IF NOT EXISTS resolution_data JSONB,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

-- Set default values for existing records
UPDATE markets 
SET 
  resolution_criteria = 'Standard resolution criteria',
  data_sources = 'CoinGecko API',
  edge_cases = 'Standard edge cases apply',
  dispute_resolution = 'Standard dispute resolution process',
  market_context = 'Market context not available',
  token_context = 'Token context not available',
  historical_context = 'Historical context not available',
  liquidity_context = 'Liquidity context not available',
  confidence_score = 0.80,
  question_type_detailed = 'price'
WHERE resolution_criteria IS NULL;
