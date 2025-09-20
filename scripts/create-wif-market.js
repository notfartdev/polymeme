// Script to create a WIF market with proper token information
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cvigkqihtsomeucxfjrd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aWdrcWlodHNvbWV1Y3hmanJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjU2MjcsImV4cCI6MjA3MzM0MTYyN30.PwrRfMDo0SqJuXgUbk5FbuPZI4iTgEo4EuK1AArsFBw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createWIFMarket() {
  try {
    // Create WIF market
    const marketData = {
      asset: 'WIF',
      question_type: 'yes-no',
      question: 'Will WIF (dogwifhat) reach $10 before the end of 2024?',
      description: 'This market resolves to YES if WIF token reaches $10 or higher before December 31, 2024. Price data will be sourced from CoinGecko.',
      closing_date: '2024-12-31 23:59:59+00',
      status: 'active',
      creator: 'demo_user',
      token_mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF token mint
      token_symbol: 'WIF',
      token_name: 'dogwifhat',
      token_logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png',
      total_yes_bets: 0,
      total_no_bets: 0,
      total_volume: 0
    }

    const { data, error } = await supabase
      .from('markets')
      .insert([marketData])
      .select()
      .single()

    if (error) {
      console.error('Error creating WIF market:', error)
      return
    }

    console.log('✅ WIF market created successfully!')
    console.log('Market ID:', data.id)
    console.log('Market Question:', data.question)
    console.log('Token Symbol:', data.token_symbol)
    console.log('Token Name:', data.token_name)
    console.log('Token Mint:', data.token_mint)

    // Create some sample WIF bets
    const sampleUsers = [
      { wallet_address: 'WIF1tg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'WIFTrader' },
      { wallet_address: 'WIF2vg3DX98f45TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'DogWifHat' },
      { wallet_address: 'WIF3tg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkv', wallet_name: 'WIFMaster' }
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

    // Create WIF bets
    const wifBets = [
      { user_id: userIds[0], bet_side: 'yes', amount: 1000, token_amount: 100 }, // 100 WIF tokens
      { user_id: userIds[1], bet_side: 'no', amount: 1500, token_amount: 150 }, // 150 WIF tokens
      { user_id: userIds[2], bet_side: 'yes', amount: 800, token_amount: 80 }, // 80 WIF tokens
      { user_id: userIds[0], bet_side: 'yes', amount: 1200, token_amount: 120 }, // 120 WIF tokens
      { user_id: userIds[1], bet_side: 'no', amount: 2000, token_amount: 200 } // 200 WIF tokens
    ]

    const betsToInsert = wifBets.map(bet => ({
      user_id: bet.user_id,
      market_id: data.id,
      bet_side: bet.bet_side,
      amount: bet.amount,
      token_mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF token mint
      token_amount: bet.token_amount,
      status: 'active',
      outcome: 'pending'
    }))

    const { data: betsData, error: betsError } = await supabase
      .from('bets')
      .insert(betsToInsert)
      .select()

    if (betsError) {
      console.error('Error inserting WIF bets:', betsError)
      return
    }

    // Update market totals
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        total_yes_bets: wifBets.filter(b => b.bet_side === 'yes').reduce((sum, b) => sum + b.amount, 0),
        total_no_bets: wifBets.filter(b => b.bet_side === 'no').reduce((sum, b) => sum + b.amount, 0),
        total_volume: wifBets.reduce((sum, b) => sum + b.amount, 0)
      })
      .eq('id', data.id)

    if (updateError) {
      console.error('Error updating WIF market:', updateError)
      return
    }

    console.log('✅ WIF bets created successfully!')
    console.log('Total YES bets:', wifBets.filter(b => b.bet_side === 'yes').reduce((sum, b) => sum + b.amount, 0))
    console.log('Total NO bets:', wifBets.filter(b => b.bet_side === 'no').reduce((sum, b) => sum + b.amount, 0))
    console.log('Total volume:', wifBets.reduce((sum, b) => sum + b.amount, 0))

  } catch (error) {
    console.error('Error:', error)
  }
}

createWIFMarket()
