-- Update markets table to include token information for betting
-- This script adds the necessary columns for token-specific betting

-- Add token-related columns to markets table
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS token_mint TEXT,
ADD COLUMN IF NOT EXISTS token_symbol TEXT,
ADD COLUMN IF NOT EXISTS token_name TEXT,
ADD COLUMN IF NOT EXISTS token_logo TEXT;

-- Add betting statistics columns
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS total_yes_bets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_no_bets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_volume DECIMAL DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_markets_token_mint ON markets(token_mint);
CREATE INDEX IF NOT EXISTS idx_markets_total_volume ON markets(total_volume DESC);

-- Update existing markets to have default SOL token
UPDATE markets 
SET 
  token_mint = 'So11111111111111111111111111111111111111112',
  token_symbol = 'SOL',
  token_name = 'Solana',
  token_logo = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
WHERE token_mint IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN markets.token_mint IS 'The mint address of the token required for betting on this market';
COMMENT ON COLUMN markets.token_symbol IS 'The symbol of the token (e.g., SOL, WIF, BONK)';
COMMENT ON COLUMN markets.token_name IS 'The full name of the token';
COMMENT ON COLUMN markets.token_logo IS 'URL to the token logo image';
COMMENT ON COLUMN markets.total_yes_bets IS 'Total number of YES bets placed';
COMMENT ON COLUMN markets.total_no_bets IS 'Total number of NO bets placed';
COMMENT ON COLUMN markets.total_volume IS 'Total volume of bets placed in the required token';
