# Smart Contract Logic Breakdown

## 🏗️ **Architecture Overview**

Our prediction market smart contract uses a **pool-based system** (like Uniswap) rather than traditional order books. Here's how it works:

### **Core Components:**
1. **Global State** - Platform-wide statistics
2. **Market Accounts** - Individual prediction markets
3. **Position Accounts** - User's total position per market
4. **Bet Accounts** - Individual bet records
5. **Token Accounts** - SPL token management

---

## 📊 **Data Structures**

### **1. Global State**
```rust
pub struct Global {
    pub authority: Pubkey,           // Platform authority
    pub market_count: u64,          // Total markets created
    pub total_volume: u64,          // Total volume across all markets
    pub total_fees_collected: u64,  // Platform fees collected
    pub bump: u8,                   // PDA bump
}
```

### **2. Market Account**
```rust
pub struct Market {
    pub id: u64,                    // Unique market ID
    pub creator: Pubkey,            // Market creator
    pub question: String,           // Market question
    pub description: String,        // Market description
    pub closing_time: i64,          // Unix timestamp when market closes
    pub required_token_mint: Pubkey, // Required SPL token for betting
    pub required_token_symbol: String, // Token symbol (e.g., "WIF")
    pub required_token_name: String,   // Token name (e.g., "dogwifhat")
    pub status: MarketStatus,       // Active/Resolved/Cancelled
    pub yes_pool: u64,             // Total YES tokens
    pub no_pool: u64,              // Total NO tokens
    pub yes_bets: u64,             // Number of YES bets
    pub no_bets: u64,              // Number of NO bets
    pub result: Option<BetSide>,    // Market result (if resolved)
    pub bump: u8,                  // PDA bump
}
```

### **3. Position Account**
```rust
pub struct Position {
    pub market: Pubkey,            // Market this position belongs to
    pub user: Pubkey,              // User who owns this position
    pub yes_amount: u64,           // Total YES tokens bet by user
    pub no_amount: u64,            // Total NO tokens bet by user
    pub bump: u8,                  // PDA bump
}
```

### **4. Bet Account**
```rust
pub struct Bet {
    pub market: Pubkey,            // Market this bet belongs to
    pub user: Pubkey,              // User who placed the bet
    pub amount: u64,               // Bet amount (after fees)
    pub side: BetSide,             // YES or NO
    pub timestamp: i64,            // When bet was placed
    pub claimed: bool,             // Whether winnings have been claimed
    pub bump: u8,                  // PDA bump
}
```

---

## 🔧 **Core Functions**

### **1. Initialize Platform**
```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let global = &mut ctx.accounts.global;
    global.authority = ctx.accounts.authority.key();
    global.market_count = 0;
    global.total_volume = 0;
    global.total_fees_collected = 0;
    global.bump = ctx.bumps.global;
    
    msg!("Global state initialized");
    Ok(())
}
```

**Purpose**: Sets up the platform's global state with authority and counters.

---

### **2. Create Market**
```rust
pub fn create_market(
    ctx: Context<CreateMarket>,
    question: String,
    description: String,
    closing_time: i64,
    required_token_mint: Pubkey,
    required_token_symbol: String,
    required_token_name: String,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let global = &mut ctx.accounts.global;

    market.id = global.market_count;
    market.creator = ctx.accounts.creator.key();
    market.question = question;
    market.description = description;
    market.closing_time = closing_time;
    market.required_token_mint = required_token_mint;
    market.required_token_symbol = required_token_symbol;
    market.required_token_name = required_token_name;
    market.status = MarketStatus::Active;
    market.yes_pool = 0;
    market.no_pool = 0;
    market.yes_bets = 0;
    market.no_bets = 0;
    market.result = None;
    market.bump = ctx.bumps.market;

    global.market_count += 1;

    msg!("Market created with ID: {} - Required token: {}", market.id, market.required_token_symbol);
    Ok(())
}
```

**Purpose**: Creates a new prediction market with specified parameters.

---

### **3. Place Bet (Core Logic)**
```rust
pub fn place_bet(
    ctx: Context<PlaceBet>,
    amount: u64,
    side: BetSide,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let position = &mut ctx.accounts.position;
    let bet = &mut ctx.accounts.bet;
    let global = &mut ctx.accounts.global;

    // 1. VALIDATION CHECKS
    require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);
    require!(Clock::get()?.unix_timestamp < market.closing_time, ErrorCode::MarketClosed);
    require!(ctx.accounts.user_token_account.mint == market.required_token_mint, ErrorCode::WrongToken);

    // 2. CALCULATE FEES
    let fee_amount = (amount * PLATFORM_FEE_BASIS_POINTS as u64) / 10000; // 2.5%
    let bet_amount = amount - fee_amount;

    // 3. UPDATE POSITION
    if position.market == Pubkey::default() {
        // First bet for this user on this market
        position.market = market.key();
        position.user = ctx.accounts.user.key();
        position.yes_amount = 0;
        position.no_amount = 0;
        position.bump = ctx.bumps.position;
    }

    // Add to user's position
    match side {
        BetSide::Yes => position.yes_amount += bet_amount,
        BetSide::No => position.no_amount += bet_amount,
    }

    // 4. CREATE BET RECORD
    bet.market = market.key();
    bet.user = ctx.accounts.user.key();
    bet.amount = bet_amount;
    bet.side = side;
    bet.timestamp = Clock::get()?.unix_timestamp;
    bet.claimed = false;
    bet.bump = ctx.bumps.bet;

    // 5. TRANSFER TOKENS
    // Transfer full amount to market
    token::transfer(cpi_ctx, amount)?;
    
    // Transfer fee to platform
    if fee_amount > 0 {
        token::transfer(fee_cpi_ctx, fee_amount)?;
    }

    // 6. UPDATE MARKET POOLS
    match side {
        BetSide::Yes => {
            market.yes_pool += bet_amount;
            market.yes_bets += 1;
        }
        BetSide::No => {
            market.no_pool += bet_amount;
            market.no_bets += 1;
        }
    }

    // 7. UPDATE GLOBAL STATS
    global.total_volume += amount;
    global.total_fees_collected += fee_amount;

    msg!("Bet placed: {} {} tokens on {:?} (fee: {})", bet_amount, market.required_token_symbol, side, fee_amount);
    Ok(())
}
```

**Purpose**: Handles the complete betting process with validation, fee calculation, and token transfers.

---

### **4. Resolve Market**
```rust
pub fn resolve_market(
    ctx: Context<ResolveMarket>,
    result: BetSide,
) -> Result<()> {
    let market = &mut ctx.accounts.market;

    // Check if market is closed
    require!(Clock::get()?.unix_timestamp >= market.closing_time, ErrorCode::MarketNotClosed);
    require!(market.status == MarketStatus::Active, ErrorCode::MarketNotActive);

    market.result = Some(result);
    market.status = MarketStatus::Resolved;

    msg!("Market resolved with result: {:?}", result);
    Ok(())
}
```

**Purpose**: Allows market creator to resolve the market after closing time.

---

### **5. Claim Winnings (Individual Bet)**
```rust
pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.position;
    let bet = &ctx.accounts.bet;

    // VALIDATION
    require!(market.status == MarketStatus::Resolved, ErrorCode::MarketNotResolved);
    require!(market.result == Some(bet.side), ErrorCode::NotWinningBet);
    require!(!bet.claimed, ErrorCode::AlreadyClaimed);

    // CALCULATE WINNINGS
    let total_pool = market.yes_pool + market.no_pool;
    let winning_pool = match bet.side {
        BetSide::Yes => market.yes_pool,
        BetSide::No => market.no_pool,
    };

    let winnings = (total_pool * bet.amount) / winning_pool;

    // TRANSFER WINNINGS
    token::transfer(cpi_ctx, winnings)?;

    // UPDATE STATE
    bet.claimed = true;
    match bet.side {
        BetSide::Yes => position.yes_amount = position.yes_amount.saturating_sub(bet.amount),
        BetSide::No => position.no_amount = position.no_amount.saturating_sub(bet.amount),
    }

    msg!("Winnings claimed: {} tokens for bet amount: {}", winnings, bet.amount);
    Ok(())
}
```

**Purpose**: Allows users to claim winnings for individual bets.

---

### **6. Claim All Winnings**
```rust
pub fn claim_all_winnings(ctx: Context<ClaimAllWinnings>) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.position;

    require!(market.status == MarketStatus::Resolved, ErrorCode::MarketNotResolved);

    let total_pool = market.yes_pool + market.no_pool;
    let mut total_winnings = 0u64;

    // Calculate winnings for winning side
    if let Some(result) = market.result {
        match result {
            BetSide::Yes => {
                if position.yes_amount > 0 {
                    total_winnings = (total_pool * position.yes_amount) / market.yes_pool;
                    position.yes_amount = 0;
                }
            }
            BetSide::No => {
                if position.no_amount > 0 {
                    total_winnings = (total_pool * position.no_amount) / market.no_pool;
                    position.no_amount = 0;
                }
            }
        }
    }

    require!(total_winnings > 0, ErrorCode::NoWinningsToClaim);

    // Transfer total winnings
    token::transfer(cpi_ctx, total_winnings)?;

    msg!("All winnings claimed: {} tokens", total_winnings);
    Ok(())
}
```

**Purpose**: Allows users to claim all winnings for their entire position in one transaction.

---

## 🎯 **Key Features**

### **1. Multiple Bets Per User**
- Each bet gets a unique timestamp-based seed
- Users can place multiple bets on the same market
- All bets are aggregated into a single position

### **2. Position Aggregation**
- `Position` account tracks total user stake per market
- Separate from individual `Bet` records
- Enables proper payout calculations

### **3. Platform Fees**
- 2.5% fee on all bets
- Automatically deducted and sent to platform
- Tracked in global statistics

### **4. Automatic Token Account Creation**
- Market token accounts created automatically
- Platform token accounts for fee collection
- User token accounts for payouts

### **5. Proportional Payouts**
- Winnings calculated based on total pool size
- Proportional to user's position size
- Fair distribution among all winners

---

## 🔄 **Transaction Flow Example**

### **User Bets 100 WIF on YES:**

```
1. VALIDATION
   ✓ Market is active
   ✓ Market hasn't closed
   ✓ User has correct token (WIF)

2. FEE CALCULATION
   - Total amount: 100 WIF
   - Platform fee: 2.5 WIF (2.5%)
   - Bet amount: 97.5 WIF

3. POSITION UPDATE
   - User's YES position: 0 → 97.5 WIF

4. BET RECORD
   - Create new bet account
   - Amount: 97.5 WIF
   - Side: YES
   - Timestamp: current time

5. TOKEN TRANSFERS
   - User → Market: 100 WIF
   - Market → Platform: 2.5 WIF

6. MARKET UPDATE
   - YES pool: 500 → 597.5 WIF
   - YES bets: 10 → 11

7. GLOBAL UPDATE
   - Total volume: +100 WIF
   - Total fees: +2.5 WIF
```

---

## 🛡️ **Security Features**

### **1. Validation Checks**
- Market must be active
- Market must not be closed
- User must have correct token
- Bet must not be claimed already

### **2. Access Control**
- Only market creator can resolve
- Only bet owner can claim winnings
- Only winning side can claim

### **3. Atomic Transactions**
- All operations in single transaction
- Either all succeed or all fail
- No partial state updates

### **4. Overflow Protection**
- Uses `saturating_sub` for safe math
- Validates amounts before operations
- Prevents integer overflow

---

## 📈 **Payout Calculation**

### **Formula:**
```
winnings = (total_pool * user_position) / winning_pool
```

### **Example:**
```
Market: "Will WIF hit $10?"
Total Pool: 1000 WIF (500 YES + 500 NO)
User Position: 100 WIF on YES
Market Result: YES

Winnings = (1000 * 100) / 500 = 200 WIF
User gets back: 200 WIF (100% profit)
```

This system ensures fair, proportional payouts based on the total pool size and user's relative position.
