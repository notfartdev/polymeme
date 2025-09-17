# Pool-Based Prediction Market Smart Contract

A Solana smart contract for pool-based prediction markets where users bet tokens and winners share the total pool proportionally.

## 🏗️ Architecture

### Core Features
- **Pool-based betting**: All bets go into YES/NO pools
- **Proportional winnings**: Winners share total pool based on bet size
- **Token-specific markets**: Each market requires a specific token (WIF, SOL, USDC, etc.)
- **Time-based markets**: Markets close at specified time
- **Creator resolution**: Market creators resolve outcomes
- **Token validation**: Smart contract enforces correct token usage

### Smart Contract Structure

```
Global State
├── Market Count
├── Total Volume
└── Authority

Market
├── Question & Description
├── Closing Time
├── Required Token Mint
├── Required Token Symbol (WIF, SOL, USDC, etc.)
├── Required Token Name (dogwifhat, Solana, USD Coin, etc.)
├── YES Pool (total tokens)
├── NO Pool (total tokens)
├── YES Bets (count)
├── NO Bets (count)
└── Result (Yes/No/None)

Bet
├── Market Reference
├── User
├── Amount
├── Side (Yes/No)
└── Timestamp
```

## 🚀 Getting Started

### Prerequisites
- Rust 1.70+
- Solana CLI 1.16+
- Anchor Framework 0.29+
- Node.js 16+

### Installation

1. **Install Solana CLI**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

2. **Install Anchor**
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

3. **Install Dependencies**
```bash
npm install
```

### Build & Deploy

```bash
# Build the program
anchor build

# Deploy to localnet
anchor deploy

# Run tests
anchor test
```

## 📝 Usage

### 1. Initialize Global State
```typescript
await program.methods
  .initialize()
  .accounts({
    global: globalPda,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Create Market
```typescript
await program.methods
  .createMarket(
    "Will Bitcoin reach $100k?",
    "Market description",
    new anchor.BN(closingTimestamp),
    wifTokenMint, // WIF token mint address
    "WIF", // Token symbol
    "dogwifhat" // Token name
  )
  .accounts({
    market: marketPda,
    global: globalPda,
    creator: creator.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3. Place Bet
```typescript
await program.methods
  .placeBet(
    new anchor.BN(100 * 10**9), // 100 tokens
    { yes: {} } // or { no: {} }
  )
  .accounts({
    bet: betPda,
    market: marketPda,
    global: globalPda,
    user: user.publicKey,
    userTokenAccount: userTokenAccount,
    marketTokenAccount: marketTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 4. Resolve Market
```typescript
await program.methods
  .resolveMarket({ yes: {} }) // or { no: {} }
  .accounts({
    market: marketPda,
    resolver: creator.publicKey,
  })
  .rpc();
```

### 5. Claim Winnings
```typescript
await program.methods
  .claimWinnings()
  .accounts({
    market: marketPda,
    bet: betPda,
    user: user.publicKey,
    userTokenAccount: userTokenAccount,
    marketTokenAccount: marketTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  })
  .rpc();
```

## 💰 How Payouts Work

### Example Scenario (WIF Market)
- **YES Pool**: 100 WIF tokens (from 2 users)
- **NO Pool**: 200 WIF tokens (from 4 users)
- **Total Pool**: 300 WIF tokens
- **Result**: NO wins

### Payout Calculation
- **User A** bet 50 WIF on NO → Gets (50/200) × 300 = 75 WIF
- **User B** bet 150 WIF on NO → Gets (150/200) × 300 = 225 WIF
- **YES bettors** get 0 WIF

### Formula
```
Your Winnings = (Your Bet / Your Pool Total) × Total Pool
```

## 🪙 Token-Specific Markets

### Market Types
- **WIF Market**: Only WIF tokens can be used to bet
- **SOL Market**: Only SOL tokens can be used to bet  
- **USDC Market**: Only USDC tokens can be used to bet
- **Custom Token Market**: Any SPL token can be specified

### Security
- Smart contract validates token mint addresses
- Users cannot bet with wrong tokens
- Each market maintains separate pools for its specific token

## 🔧 Configuration

### Update Program ID
1. Generate new keypair: `solana-keygen new -o target/deploy/prediction_market-keypair.json`
2. Update `Anchor.toml` with new program ID
3. Update `declare_id!` in `lib.rs`

### Deploy to Different Networks
```bash
# Localnet
anchor deploy --provider.cluster localnet

# Devnet
anchor deploy --provider.cluster devnet

# Mainnet
anchor deploy --provider.cluster mainnet
```

## 🧪 Testing

```bash
# Run all tests
anchor test

# Run specific test
anchor test -- --grep "Place a YES bet"
```

## 📊 Integration with Frontend

The smart contract provides the exact data structure your frontend expects:

```typescript
// Pool data structure
{
  yesPool: {
    totalTokens: 150.5,
    totalBets: 25
  },
  noPool: {
    totalTokens: 200.3,
    totalBets: 18
  }
}
```

## 🔒 Security Features

- **PDA-based accounts**: All accounts use Program Derived Addresses
- **Authority checks**: Only authorized users can resolve markets
- **Time validation**: Markets can only be resolved after closing time
- **Token validation**: Only specified tokens can be used for betting
- **Overflow protection**: All arithmetic operations use checked math

## 📈 Future Enhancements

- Oracle integration for automated resolution
- Fee collection for platform
- Market categories and tags
- Advanced betting options (multiple outcomes)
- Liquidity requirements before betting starts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
