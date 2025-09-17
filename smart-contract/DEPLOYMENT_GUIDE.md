# Smart Contract Deployment Guide

## 🚀 Quick Start

Once Visual Studio Build Tools are installed, follow these steps:

### 1. Build the Smart Contract
```bash
cd smart-contract
anchor build
```

### 2. Generate Program ID
```bash
solana-keygen new -o target/deploy/prediction_market-keypair.json
```

### 3. Update Program ID
1. Copy the generated public key from the keypair file
2. Update `Anchor.toml`:
```toml
[programs.localnet]
prediction_market = "YOUR_GENERATED_PROGRAM_ID"
```

3. Update `programs/prediction-market/src/lib.rs`:
```rust
declare_id!("YOUR_GENERATED_PROGRAM_ID");
```

### 4. Deploy to Localnet
```bash
# Start local validator (in separate terminal)
solana-test-validator

# Deploy the program
anchor deploy
```

### 5. Run Tests
```bash
anchor test
```

### 6. Update Frontend Configuration
Update `lib/smart-contract.ts`:
```typescript
export const SMART_CONTRACT_CONFIG = {
  PROGRAM_ID: new PublicKey("YOUR_GENERATED_PROGRAM_ID"),
  RPC_URL: "http://localhost:8899", // Localnet
}
```

## 🔧 Troubleshooting

### Build Errors
- Ensure Visual Studio Build Tools are installed
- Restart terminal after installing build tools
- Run `cargo clean` if build fails

### Deployment Errors
- Ensure local validator is running
- Check program ID is correctly set
- Verify sufficient SOL balance for deployment

### Test Errors
- Ensure all dependencies are installed
- Check that local validator is running
- Verify program is deployed correctly

## 📝 Next Steps

1. **Deploy to Devnet**: Update RPC URL and deploy to devnet
2. **Deploy to Mainnet**: Final deployment to mainnet
3. **Frontend Integration**: Connect frontend to deployed contract
4. **Testing**: Comprehensive testing with real transactions

## 🎯 Integration Checklist

- [ ] Build smart contract successfully
- [ ] Deploy to localnet
- [ ] Run tests successfully
- [ ] Update frontend configuration
- [ ] Test frontend integration
- [ ] Deploy to devnet
- [ ] Deploy to mainnet
- [ ] Production testing

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Solana and Anchor documentation
3. Check console logs for detailed error messages
4. Ensure all prerequisites are installed correctly
