-- Create markets table for Supabase
CREATE TABLE IF NOT EXISTS markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('yes-no', 'multiple-choice', 'numeric', 'date')),
  question TEXT NOT NULL,
  description TEXT NOT NULL,
  closing_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed')),
  creator TEXT NOT NULL DEFAULT 'demo_user',
  token_mint TEXT,
  
  -- Type-specific fields
  multiple_choice_options JSONB,
  min_value TEXT,
  max_value TEXT,
  unit TEXT,
  earliest_date TIMESTAMP WITH TIME ZONE,
  latest_date TIMESTAMP WITH TIME ZONE,
  
  -- Betting fields
  initial_bet_amount TEXT,
  bet_side TEXT CHECK (bet_side IN ('yes', 'no')),
  total_yes_bets INTEGER DEFAULT 0,
  total_no_bets INTEGER DEFAULT 0,
  total_volume DECIMAL DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_asset ON markets(asset);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator);

-- Enable Row Level Security (RLS)
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (in production, you'd want more restrictive policies)
CREATE POLICY "Allow all operations on markets" ON markets
  FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample data
INSERT INTO markets (asset, question_type, question, description, closing_date, creator) VALUES
('SOL', 'yes-no', 'Will Solana reach $200 by end of 2024?', 'Predicting if Solana will hit $200 by December 31, 2024', '2024-12-31 23:59:59+00', 'demo_user'),
('BTC', 'yes-no', 'Will Bitcoin reach $100,000 in 2024?', 'Predicting if Bitcoin will reach $100,000 by end of 2024', '2024-12-31 23:59:59+00', 'demo_user'),
('ETH', 'yes-no', 'Will Ethereum reach $5,000 by Q2 2024?', 'Predicting if Ethereum will hit $5,000 by end of Q2 2024', '2024-06-30 23:59:59+00', 'demo_user');
