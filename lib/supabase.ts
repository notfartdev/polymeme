import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cvigkqihtsomeucxfjrd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aWdrcWlodHNvbWV1Y3hmanJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjU2MjcsImV4cCI6MjA3MzM0MTYyN30.PwrRfMDo0SqJuXgUbk5FbuPZI4iTgEo4EuK1AArsFBw'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Market {
  id: string
  asset: string
  question_type: string
  question: string
  description: string
  closing_date: string
  created_at: string
  status: 'active' | 'pending' | 'closed'
  creator: string
  token_mint?: string
  // Type-specific fields
  multiple_choice_options?: string[]
  min_value?: string
  max_value?: string
  unit?: string
  earliest_date?: string
  latest_date?: string
  // Betting fields
  initial_bet_amount?: string
  bet_side?: 'yes' | 'no'
  total_yes_bets?: number
  total_no_bets?: number
  total_volume?: number
}
