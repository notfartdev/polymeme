-- Create bets table for storing user betting activity
CREATE TABLE IF NOT EXISTS bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  bet_side TEXT NOT NULL CHECK (bet_side IN ('yes', 'no')),
  amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
  token_mint TEXT NOT NULL, -- The token used for betting (e.g., SOL, BONK, etc.)
  token_amount DECIMAL(20, 8) NOT NULL, -- Amount of tokens bet
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'pending')),
  pnl DECIMAL(20, 8) DEFAULT 0, -- Profit/Loss from this bet
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_market_id ON bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_outcome ON bets(outcome);

-- Enable Row Level Security (RLS)
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  -- Allow users to read all bets (for leaderboards, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bets' AND policyname = 'Allow read access to all bets'
  ) THEN
    CREATE POLICY "Allow read access to all bets" ON bets FOR SELECT USING (true);
  END IF;

  -- Allow users to insert their own bets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bets' AND policyname = 'Allow users to insert own bets'
  ) THEN
    CREATE POLICY "Allow users to insert own bets" ON bets FOR INSERT 
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);
  END IF;

  -- Allow users to update their own bets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bets' AND policyname = 'Allow users to update own bets'
  ) THEN
    CREATE POLICY "Allow users to update own bets" ON bets FOR UPDATE 
    USING (user_id = current_setting('app.current_user_id', true)::uuid);
  END IF;
END $$;

-- Create function to update user betting stats
CREATE OR REPLACE FUNCTION update_user_betting_stats()
RETURNS TRIGGER AS $$
DECLARE
  user_record users%ROWTYPE;
  total_bets_count INTEGER;
  total_volume DECIMAL;
  total_pnl DECIMAL;
  win_count INTEGER;
  win_rate DECIMAL;
BEGIN
  -- Get the user record
  SELECT * INTO user_record FROM users WHERE id = NEW.user_id;
  
  -- Calculate total bets placed
  SELECT COUNT(*) INTO total_bets_count 
  FROM bets 
  WHERE user_id = NEW.user_id AND status != 'cancelled';
  
  -- Calculate total volume traded
  SELECT COALESCE(SUM(amount), 0) INTO total_volume 
  FROM bets 
  WHERE user_id = NEW.user_id AND status != 'cancelled';
  
  -- Calculate total P&L
  SELECT COALESCE(SUM(pnl), 0) INTO total_pnl 
  FROM bets 
  WHERE user_id = NEW.user_id AND status = 'settled';
  
  -- Calculate win rate
  SELECT COUNT(*) INTO win_count 
  FROM bets 
  WHERE user_id = NEW.user_id AND status = 'settled' AND outcome = 'won';
  
  IF total_bets_count > 0 THEN
    win_rate := (win_count::DECIMAL / total_bets_count::DECIMAL) * 100;
  ELSE
    win_rate := 0;
  END IF;
  
  -- Update user stats
  UPDATE users SET
    total_bets_placed = total_bets_count,
    total_volume_traded = total_volume,
    total_pnl = total_pnl,
    win_rate = win_rate,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user stats when bets are inserted/updated
DROP TRIGGER IF EXISTS trg_update_user_betting_stats ON bets;
CREATE TRIGGER trg_update_user_betting_stats
  AFTER INSERT OR UPDATE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION update_user_betting_stats();

-- Create function to get user betting stats
CREATE OR REPLACE FUNCTION get_user_betting_stats(p_user_id UUID)
RETURNS TABLE (
  total_bets INTEGER,
  total_volume DECIMAL,
  total_pnl DECIMAL,
  win_rate DECIMAL,
  active_positions INTEGER,
  best_trade DECIMAL,
  worst_trade DECIMAL,
  avg_trade DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_bets,
    COALESCE(SUM(amount), 0) as total_volume,
    COALESCE(SUM(CASE WHEN status = 'settled' THEN pnl ELSE 0 END), 0) as total_pnl,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(CASE WHEN status = 'settled' AND outcome = 'won' THEN 1 END)::DECIMAL / COUNT(CASE WHEN status = 'settled' THEN 1 END)::DECIMAL) * 100
    END as win_rate,
    COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_positions,
    COALESCE(MAX(CASE WHEN status = 'settled' THEN pnl END), 0) as best_trade,
    COALESCE(MIN(CASE WHEN status = 'settled' THEN pnl END), 0) as worst_trade,
    CASE 
      WHEN COUNT(CASE WHEN status = 'settled' THEN 1 END) = 0 THEN 0
      ELSE COALESCE(SUM(CASE WHEN status = 'settled' THEN pnl ELSE 0 END) / COUNT(CASE WHEN status = 'settled' THEN 1 END), 0)
    END as avg_trade
  FROM bets 
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user trading activity
CREATE OR REPLACE FUNCTION get_user_trading_activity(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  bet_id UUID,
  market_id UUID,
  market_title TEXT,
  market_description TEXT,
  bet_side TEXT,
  amount DECIMAL,
  token_mint TEXT,
  token_amount DECIMAL,
  outcome TEXT,
  pnl DECIMAL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  settled_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bet_id,
    b.market_id,
    m.question as market_title,
    m.description as market_description,
    b.bet_side,
    b.amount,
    b.token_mint,
    b.token_amount,
    b.outcome,
    b.pnl,
    b.status,
    b.created_at,
    b.settled_at
  FROM bets b
  JOIN markets m ON b.market_id = m.id
  WHERE b.user_id = p_user_id
  ORDER BY b.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional - remove in production)
-- INSERT INTO bets (user_id, market_id, bet_side, amount, token_mint, token_amount, outcome, pnl, status) 
-- SELECT 
--   u.id,
--   m.id,
--   CASE WHEN random() > 0.5 THEN 'yes' ELSE 'no' END,
--   (random() * 1000 + 100)::DECIMAL,
--   'So11111111111111111111111111111111111111112', -- SOL
--   (random() * 10 + 1)::DECIMAL,
--   CASE WHEN random() > 0.3 THEN 'won' ELSE 'lost' END,
--   (random() * 200 - 100)::DECIMAL,
--   CASE WHEN random() > 0.7 THEN 'active' ELSE 'settled' END
-- FROM users u
-- CROSS JOIN markets m
-- WHERE random() > 0.8 -- Only create bets for some users/markets
-- LIMIT 20;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
