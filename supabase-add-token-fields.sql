-- Add token symbol and name fields to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS token_symbol TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS token_name TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS token_logo TEXT;

-- Update existing markets to have token symbol based on asset
UPDATE markets 
SET token_symbol = asset, 
    token_name = CASE 
      WHEN asset = 'SOL' THEN 'Solana'
      WHEN asset = 'BTC' THEN 'Bitcoin'
      WHEN asset = 'ETH' THEN 'Ethereum'
      WHEN asset = 'WIF' THEN 'dogwifhat'
      WHEN asset = 'BONK' THEN 'Bonk'
      WHEN asset = 'PUMP' THEN 'Pump.fun'
      WHEN asset = 'BOME' THEN 'Book of Meme'
      WHEN asset = 'JUP' THEN 'Jupiter'
      WHEN asset = 'SLERF' THEN 'Slerf'
      WHEN asset = 'MYRO' THEN 'Myro'
      ELSE asset
    END
WHERE token_symbol IS NULL;

-- Update token_mint for common tokens
UPDATE markets 
SET token_mint = CASE 
  WHEN asset = 'SOL' THEN 'So11111111111111111111111111111111111111112'
  WHEN asset = 'WIF' THEN 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
  WHEN asset = 'BONK' THEN 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
  WHEN asset = 'PUMP' THEN '6WCsTZLuVUePi9U7JzjH3HMU9cWBq7QeJk9VW2nWpX1C'
  WHEN asset = 'BOME' THEN 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82'
  WHEN asset = 'JUP' THEN 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
  WHEN asset = 'SLERF' THEN '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx8L8L3nY'
  WHEN asset = 'MYRO' THEN 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4'
  ELSE token_mint
END
WHERE token_mint IS NULL OR token_mint = '';

-- Add index for token_symbol
CREATE INDEX IF NOT EXISTS idx_markets_token_symbol ON markets(token_symbol);
