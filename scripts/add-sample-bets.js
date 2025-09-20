// Script to add sample betting data to the database
// Run with: node scripts/add-sample-bets.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cvigkqihtsomeucxfjrd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aWdrcWlodHNvbWV1Y3hmanJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjU2MjcsImV4cCI6MjA3MzM0MTYyN30.PwrRfMDo0SqJuXgUbk5FbuPZI4iTgEo4EuK1AArsFBw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addSampleData() {
  try {
    // First, get the first market from the database
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('id')
      .limit(1)

    if (marketsError || !markets.length) {
      console.error('No markets found:', marketsError)
      return
    }

    const marketId = markets[0].id
    console.log('Using market ID:', marketId)

    // Create some sample users with wallet addresses
    const sampleUsers = [
      { wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'CryptoKing' },
      { wallet_address: '9yMNvg3DX98f45TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'PredictorPro' },
      { wallet_address: '5zLKtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'MarketMaster' },
      { wallet_address: '3wJXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'TradingGuru' },
      { wallet_address: '8vKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'BetMaster' }
    ]

    // Get or create users
    const userIds = []
    for (const user of sampleUsers) {
      const { data: userData, error: userError } = await supabase
        .rpc('get_or_create_user', {
          p_wallet_address: user.wallet_address,
          p_wallet_name: user.wallet_name
        })

      if (userError) {
        console.error('Error creating user:', userError)
        continue
      }
      userIds.push(userData.id)
    }

    console.log('Created users:', userIds.length)

    // Create sample bets
    const sampleBets = [
      { user_id: userIds[0], bet_side: 'yes', amount: 500, token_amount: 2.5 },
      { user_id: userIds[1], bet_side: 'no', amount: 750, token_amount: 3.75 },
      { user_id: userIds[2], bet_side: 'yes', amount: 300, token_amount: 1.5 },
      { user_id: userIds[3], bet_side: 'no', amount: 1000, token_amount: 5.0 },
      { user_id: userIds[4], bet_side: 'yes', amount: 250, token_amount: 1.25 },
      { user_id: userIds[0], bet_side: 'yes', amount: 400, token_amount: 2.0 },
      { user_id: userIds[1], bet_side: 'no', amount: 600, token_amount: 3.0 },
      { user_id: userIds[2], bet_side: 'no', amount: 350, token_amount: 1.75 },
      { user_id: userIds[3], bet_side: 'yes', amount: 800, token_amount: 4.0 },
      { user_id: userIds[4], bet_side: 'no', amount: 150, token_amount: 0.75 }
    ]

    // Insert bets
    const betsToInsert = sampleBets.map(bet => ({
      user_id: bet.user_id,
      market_id: marketId,
      bet_side: bet.bet_side,
      amount: bet.amount,
      token_mint: 'So11111111111111111111111111111111111111112', // SOL
      token_amount: bet.token_amount,
      status: 'active',
      outcome: 'pending'
    }))

    const { data: betsData, error: betsError } = await supabase
      .from('bets')
      .insert(betsToInsert)
      .select()

    if (betsError) {
      console.error('Error inserting bets:', betsError)
      return
    }

    console.log('Created bets:', betsData.length)

    // Update market totals
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        total_yes_bets: sampleBets.filter(b => b.bet_side === 'yes').reduce((sum, b) => sum + b.amount, 0),
        total_no_bets: sampleBets.filter(b => b.bet_side === 'no').reduce((sum, b) => sum + b.amount, 0),
        total_volume: sampleBets.reduce((sum, b) => sum + b.amount, 0)
      })
      .eq('id', marketId)

    if (updateError) {
      console.error('Error updating market:', updateError)
      return
    }

    console.log('✅ Sample data added successfully!')
    console.log('Market ID:', marketId)
    console.log('Users created:', userIds.length)
    console.log('Bets created:', betsData.length)

  } catch (error) {
    console.error('Error:', error)
  }
}

addSampleData()
