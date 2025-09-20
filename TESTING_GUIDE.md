# Testing Guide: How to Verify Everything is Working

## 🎯 **Testing Strategy**

We need to test at multiple levels:
1. **Smart Contract** - Deploy and test on devnet
2. **Frontend Integration** - Test wallet connection and transactions
3. **End-to-End Flow** - Complete betting process
4. **Real Data** - Verify blockchain data matches UI

---

## 🚀 **Step 1: Deploy Smart Contract**

### **1.1 Install Solana CLI**
```bash
# Download and install Solana CLI
curl -sSfL https://release.solana.com/v1.18.4/install | sh

# Add to PATH (Windows)
# Add C:\Users\Ivan\.local\share\solana\install\active_release\bin to PATH

# Verify installation
solana --version
```

### **1.2 Generate Program Keypair**
```bash
cd smart-contract
solana-keygen new -o target/deploy/prediction_market-keypair.json --no-bip39-passphrase
```

### **1.3 Update Program ID**
```bash
# Get the public key from the keypair
solana-keygen pubkey target/deploy/prediction_market-keypair.json
```

Update these files with the generated program ID:
- `smart-contract/programs/prediction-market/src/lib.rs` (line 5)
- `smart-contract/Anchor.toml` (all program IDs)
- `lib/smart-contract-real.ts` (PROGRAM_ID)

### **1.4 Build and Deploy**
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### **1.5 Verify Deployment**
```bash
# Check program is deployed
solana program show <PROGRAM_ID> --url devnet

# Should show: "Program Id: <PROGRAM_ID>"
```

---

## 🧪 **Step 2: Test Smart Contract Functions**

### **2.1 Initialize Platform**
```bash
# Create a test script
anchor test --skip-local-validator
```

### **2.2 Test Market Creation**
```typescript
// Test script: test_market_creation.ts
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

async function testMarketCreation() {
  const connection = new Connection('https://api.devnet.solana.com')
  const wallet = Keypair.generate()
  
  // Initialize program
  const program = new Program(idl, programId, provider)
  
  // Create market
  const tx = await program.methods
    .createMarket(
      "Will WIF hit $10 by end of 2024?",
      "Test market for WIF token",
      new anchor.BN(Date.now() + 86400 * 30), // 30 days from now
      new PublicKey("So11111111111111111111111111111111111111112"), // WIF token mint
      "WIF",
      "dogwifhat"
    )
    .rpc()
    
  console.log("Market created:", tx)
}
```

### **2.3 Test Betting**
```typescript
async function testBetting() {
  // Place a bet
  const tx = await program.methods
    .placeBet(
      new anchor.BN(1000000), // 1 WIF (6 decimals)
      { yes: {} }
    )
    .accounts({
      // ... all required accounts
    })
    .rpc()
    
  console.log("Bet placed:", tx)
}
```

---

## 🖥️ **Step 3: Test Frontend Integration**

### **3.1 Start Development Server**
```bash
cd ..
npm run dev
```

### **3.2 Test Wallet Connection**
1. Open browser to `http://localhost:3000`
2. Click "Connect Wallet"
3. Select Phantom wallet
4. **Expected**: Wallet connects and shows address

### **3.3 Test Market Creation**
1. Go to `/create-market`
2. Connect wallet
3. Select a token from wallet
4. Fill in market details
5. Click "Create Market"
6. **Expected**: Transaction popup, market created

### **3.4 Test Betting Interface**
1. Go to `/markets`
2. Click on a market
3. Click "Place Bet"
4. Select YES/NO and amount
5. Click "Place Bet"
6. **Expected**: Transaction popup, bet placed

---

## 🔍 **Step 4: Verify Data Consistency**

### **4.1 Check Blockchain Data**
```typescript
// Verify market data on blockchain
const marketData = await program.account.market.fetch(marketPDA)
console.log("Market on blockchain:", marketData)

// Verify user position
const positionData = await program.account.position.fetch(positionPDA)
console.log("User position:", positionData)
```

### **4.2 Check Frontend Display**
1. Go to market page
2. **Expected**: Pool data matches blockchain
3. **Expected**: User position matches blockchain
4. **Expected**: Odds calculation is correct

### **4.3 Check Database Sync**
```sql
-- Check market in database
SELECT * FROM markets WHERE id = 'market_id';

-- Should match blockchain data
```

---

## 🧪 **Step 5: End-to-End Testing**

### **5.1 Complete Betting Flow**
```
1. Create market ✅
2. User A bets 100 WIF on YES ✅
3. User B bets 50 WIF on NO ✅
4. Check pool updates ✅
5. Check position tracking ✅
6. Resolve market ✅
7. Claim winnings ✅
```

### **5.2 Test Edge Cases**
- **Insufficient balance**: Try betting more than user has
- **Market closed**: Try betting after closing time
- **Wrong token**: Try betting with different token
- **Double claiming**: Try claiming same bet twice

---

## 📊 **Step 6: Performance Testing**

### **6.1 Transaction Speed**
```typescript
const startTime = Date.now()
await program.methods.placeBet(...).rpc()
const endTime = Date.now()
console.log(`Transaction time: ${endTime - startTime}ms`)
```

### **6.2 Gas Costs**
```typescript
// Check transaction fees
const tx = await program.methods.placeBet(...).rpc()
const txDetails = await connection.getTransaction(tx)
console.log("Transaction fee:", txDetails.meta.fee)
```

---

## 🐛 **Step 7: Debugging Common Issues**

### **7.1 Transaction Failures**
```typescript
try {
  await program.methods.placeBet(...).rpc()
} catch (error) {
  console.error("Transaction failed:", error)
  // Check error codes in smart contract
}
```

### **7.2 Account Not Found**
```typescript
try {
  const account = await program.account.market.fetch(marketPDA)
} catch (error) {
  if (error.message.includes("Account does not exist")) {
    console.log("Market not created yet")
  }
}
```

### **7.3 Insufficient Funds**
```typescript
// Check user balance before betting
const balance = await connection.getTokenAccountBalance(userTokenAccount)
if (balance.value.amount < betAmount) {
  console.log("Insufficient balance")
}
```

---

## ✅ **Success Criteria**

### **Smart Contract Tests Pass:**
- [ ] Program deploys successfully
- [ ] Market creation works
- [ ] Betting works
- [ ] Position tracking works
- [ ] Claiming works
- [ ] All validations work

### **Frontend Tests Pass:**
- [ ] Wallet connects
- [ ] Market creation UI works
- [ ] Betting interface works
- [ ] Real-time updates work
- [ ] Error handling works

### **Integration Tests Pass:**
- [ ] Frontend data matches blockchain
- [ ] Transactions execute successfully
- [ ] Pool data updates correctly
- [ ] Position tracking works
- [ ] End-to-end flow works

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Program not found"**
   - Check program ID is correct
   - Verify program is deployed
   - Check RPC URL

2. **"Insufficient funds"**
   - Check user has enough tokens
   - Check user has SOL for transaction fees

3. **"Account does not exist"**
   - Check PDA derivation
   - Verify account is created

4. **"Transaction failed"**
   - Check error logs
   - Verify all accounts are provided
   - Check validation requirements

### **Debug Commands:**
```bash
# Check program logs
solana logs <PROGRAM_ID> --url devnet

# Check account data
solana account <ACCOUNT_ADDRESS> --url devnet

# Check transaction
solana confirm <TRANSACTION_SIGNATURE> --url devnet
```

---

## 📈 **Monitoring & Analytics**

### **Track Key Metrics:**
- Transaction success rate
- Average transaction time
- Gas costs
- User engagement
- Pool liquidity
- Platform fees collected

### **Set Up Monitoring:**
```typescript
// Track successful transactions
const successRate = successfulTxs / totalTxs

// Track average transaction time
const avgTxTime = totalTime / totalTxs

// Track platform fees
const totalFees = await program.account.global.fetch(globalPDA)
console.log("Total fees collected:", totalFees.totalFeesCollected)
```

This comprehensive testing approach will ensure your prediction market is working correctly at every level!
