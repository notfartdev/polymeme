# Betting Transaction Flow

## 🎯 **Complete User Betting Flow**

### **Step 1: User Interface**
```
User sees market: "Will WIF hit $10 by end of 2024?"
Current odds: YES 62.5% | NO 37.5%
User enters: 100 WIF tokens
User clicks: "Bet YES"
```

### **Step 2: Frontend Preparation**
```typescript
// Frontend prepares transaction
const betAmount = 100 * 10^6; // 100 WIF (6 decimals)
const side = 'yes';

// Call smart contract
await program.methods
  .placeBet(betAmount, { yes: {} })
  .accounts({
    bet: betPda,
    position: positionPda,
    market: marketPda,
    user: wallet.publicKey,
    userTokenAccount: userWifAccount,
    marketTokenAccount: marketWifAccount,
    platformTokenAccount: platformWifAccount,
    // ... other accounts
  })
  .rpc();
```

### **Step 3: Phantom Wallet Popup**
```
┌─────────────────────────────────┐
│ Phantom Wallet                  │
├─────────────────────────────────┤
│ Transaction Details:            │
│                                 │
│ From: Your Wallet               │
│ To: Market Pool                 │
│ Amount: 100 WIF                 │
│ Fee: 2.5 WIF (Platform)         │
│                                 │
│ [Cancel] [Approve]              │
└─────────────────────────────────┘
```

### **Step 4: Blockchain Transaction**
```rust
// Single Solana transaction executes:

1. Create Bet Account (97.5 WIF)
   └── Records: user, amount, side, timestamp

2. Create/Update Position Account
   └── Updates: user's total YES position

3. Transfer 100 WIF from user to market
   └── User: 1000 WIF → 900 WIF
   └── Market: 500 WIF → 597.5 WIF

4. Transfer 2.5 WIF to platform
   └── Platform: 0 WIF → 2.5 WIF

5. Update Market Pools
   └── YES Pool: 500 WIF → 597.5 WIF
   └── YES Bets: 10 → 11
```

### **Step 5: Updated Order Book**
```
Market: "Will WIF hit $10 by end of 2024?"

BEFORE:
YES: 500 WIF (62.5%) | NO: 300 WIF (37.5%)

AFTER:
YES: 597.5 WIF (66.6%) | NO: 300 WIF (33.4%)

New Odds:
- YES: 66.6%
- NO: 33.4%
```

## 🏊 **Pool System Details**

### **Each Market Has:**
- **YES Pool**: All tokens bet on YES outcome
- **NO Pool**: All tokens bet on NO outcome
- **Market Token Account**: Holds all bet tokens
- **Platform Fee Account**: Holds all platform fees

### **Pool Updates:**
```rust
// Every bet updates pools
match side {
    BetSide::Yes => {
        market.yes_pool += bet_amount;  // Add to YES pool
        market.yes_bets += 1;           // Increment bet count
    }
    BetSide::No => {
        market.no_pool += bet_amount;   // Add to NO pool
        market.no_bets += 1;            // Increment bet count
    }
}
```

## 📊 **Order Book Display**

### **Frontend Shows:**
```typescript
interface OrderBookEntry {
  side: 'yes' | 'no';
  price: number;        // Current odds (0-1)
  liquidity: number;    // Total pool size
  bets: number;         // Number of bets
  volume24h: number;    // 24h volume
}

const orderBook: OrderBookEntry[] = [
  {
    side: 'yes',
    price: 0.666,       // 66.6%
    liquidity: 597.5,   // WIF tokens
    bets: 11,
    volume24h: 150
  },
  {
    side: 'no', 
    price: 0.334,       // 33.4%
    liquidity: 300,     // WIF tokens
    bets: 8,
    volume24h: 75
  }
];
```

## 🔄 **Transaction Types**

### **1. Place Bet Transaction:**
- **Type**: Smart Contract Call
- **Instructions**: 5-7 instructions in one transaction
- **Cost**: ~0.00025 SOL (rent + fees)
- **Time**: ~1-2 seconds

### **2. Claim Winnings Transaction:**
- **Type**: Smart Contract Call  
- **Instructions**: Transfer winnings to user
- **Cost**: ~0.00025 SOL
- **Time**: ~1-2 seconds

### **3. Resolve Market Transaction:**
- **Type**: Smart Contract Call
- **Instructions**: Set market result
- **Cost**: ~0.00025 SOL
- **Time**: ~1-2 seconds

## 💡 **Key Benefits of This System**

### **✅ Advantages:**
- **Simple**: No complex order matching
- **Predictable**: Clear odds calculation
- **Fast**: Single transaction per bet
- **Fair**: Proportional payouts
- **Transparent**: All on-chain

### **✅ User Experience:**
- Click bet → Sign transaction → Done
- No waiting for order matching
- Immediate pool updates
- Real-time odds changes

## 🎯 **Summary**

1. **Order Book = Pool State**: Shows current YES/NO pools and odds
2. **Betting = Single Transaction**: Transfers tokens and updates pools
3. **Each Market = Separate Pools**: Independent token pools per market
4. **Phantom Signs**: User signs one transaction that does everything
5. **Real-time Updates**: Pools update immediately after each bet

This system is much simpler than traditional order books but provides the same functionality with better UX!
