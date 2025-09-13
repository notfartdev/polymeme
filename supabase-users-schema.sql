-- Create users table for storing wallet-connected users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  wallet_name TEXT, -- e.g., "Phantom", "Solflare"
  username TEXT, -- Optional display name
  email TEXT, -- Optional email for notifications
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- User stats
  total_markets_created INTEGER DEFAULT 0,
  total_bets_placed INTEGER DEFAULT 0,
  total_volume_traded DECIMAL DEFAULT 0,
  win_rate DECIMAL DEFAULT 0, -- Percentage of winning bets
  total_pnl DECIMAL DEFAULT 0, -- Profit and Loss
  
  -- Profile data
  bio TEXT,
  avatar_url TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{"email": false, "push": true}',
  privacy_settings JSONB DEFAULT '{"show_stats": true, "show_portfolio": true}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_total_volume ON users(total_volume_traded DESC);
CREATE INDEX IF NOT EXISTS idx_users_win_rate ON users(win_rate DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all user data (for leaderboards, etc.)
CREATE POLICY "Allow read access to all users" ON users
  FOR SELECT USING (true);

-- Create policy to allow users to update only their own data
CREATE POLICY "Allow users to update own data" ON users
  FOR UPDATE USING (wallet_address = current_setting('app.current_user_wallet', true));

-- Create policy to allow users to insert their own data
CREATE POLICY "Allow users to insert own data" ON users
  FOR INSERT WITH CHECK (wallet_address = current_setting('app.current_user_wallet', true));

-- Update markets table to link to users
ALTER TABLE markets ADD COLUMN IF NOT EXISTS creator_wallet_address TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES users(id);

-- Create index for market creator lookup
CREATE INDEX IF NOT EXISTS idx_markets_creator_wallet ON markets(creator_wallet_address);
CREATE INDEX IF NOT EXISTS idx_markets_creator_user_id ON markets(creator_user_id);

-- Update existing markets to have creator data
UPDATE markets SET creator_wallet_address = 'demo_user' WHERE creator_wallet_address IS NULL;

-- Create a function to get or create user
CREATE OR REPLACE FUNCTION get_or_create_user(
  p_wallet_address TEXT,
  p_wallet_name TEXT DEFAULT NULL
) RETURNS users AS $$
DECLARE
  user_record users;
BEGIN
  -- Try to find existing user
  SELECT * INTO user_record FROM users WHERE wallet_address = p_wallet_address;
  
  -- If user doesn't exist, create them
  IF NOT FOUND THEN
    INSERT INTO users (wallet_address, wallet_name, last_login)
    VALUES (p_wallet_address, p_wallet_name, NOW())
    RETURNING * INTO user_record;
  ELSE
    -- Update last login for existing user
    UPDATE users SET last_login = NOW(), wallet_name = COALESCE(p_wallet_name, wallet_name)
    WHERE wallet_address = p_wallet_address
    RETURNING * INTO user_record;
  END IF;
  
  RETURN user_record;
END;
$$ LANGUAGE plpgsql;
