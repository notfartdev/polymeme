-- Migration to add comprehensive market rules and resolution fields to markets table
-- Run this in your Supabase SQL editor

-- Add comprehensive market rules fields
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
ADD COLUMN IF NOT EXISTS question_type_detailed TEXT;

-- Add resolution fields
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS resolution TEXT CHECK (resolution IN ('yes', 'no', 'disputed')),
ADD COLUMN IF NOT EXISTS resolution_data JSONB,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_markets_resolution ON markets(resolution);
CREATE INDEX IF NOT EXISTS idx_markets_resolved_at ON markets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_markets_question_type_detailed ON markets(question_type_detailed);

-- Update existing markets to have default values for new fields
UPDATE markets 
SET 
  resolution_criteria = 'Standard price-based resolution',
  data_sources = 'CoinGecko API',
  edge_cases = 'Standard market conditions apply',
  dispute_resolution = 'Disputes must be submitted within 24 hours of market close',
  market_context = 'Market context not available for legacy markets',
  token_context = 'Token analysis not available for legacy markets',
  historical_context = 'Historical data not available for legacy markets',
  liquidity_context = 'Liquidity analysis not available for legacy markets',
  confidence_score = 0.80,
  question_type_detailed = 'price'
WHERE resolution_criteria IS NULL;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'markets' 
  AND column_name IN (
    'resolution_criteria', 
    'data_sources', 
    'edge_cases', 
    'dispute_resolution',
    'market_context',
    'token_context', 
    'historical_context',
    'liquidity_context',
    'confidence_score',
    'question_type_detailed',
    'resolution',
    'resolution_data',
    'resolved_at',
    'dispute_reason'
  )
ORDER BY column_name;
