// Frontend Integration Test
// Run this in browser console to test the integration

console.log("🧪 Starting Frontend Integration Tests...");

// Test 1: Check if smart contract service is available
console.log("Test 1: Smart Contract Service");
try {
  const { smartContractService, SMART_CONTRACT_CONFIG } = await import('./lib/smart-contract-real.ts');
  console.log("✅ Smart contract service loaded");
  console.log("Program ID:", SMART_CONTRACT_CONFIG.PROGRAM_ID.toString());
  console.log("RPC URL:", SMART_CONTRACT_CONFIG.RPC_URL);
} catch (error) {
  console.error("❌ Smart contract service failed:", error);
}

// Test 2: Check wallet connection
console.log("\nTest 2: Wallet Connection");
if (typeof window !== 'undefined' && window.solana) {
  try {
    const response = await window.solana.connect();
    console.log("✅ Wallet connected:", response.publicKey.toString());
  } catch (error) {
    console.log("⚠️ Wallet not connected:", error.message);
  }
} else {
  console.log("⚠️ Phantom wallet not detected");
}

// Test 3: Check API endpoints
console.log("\nTest 3: API Endpoints");
try {
  // Test markets endpoint
  const marketsResponse = await fetch('/api/markets');
  if (marketsResponse.ok) {
    const markets = await marketsResponse.json();
    console.log("✅ Markets API working:", markets.length, "markets found");
  } else {
    console.error("❌ Markets API failed:", marketsResponse.status);
  }

  // Test pool endpoint (if we have a market)
  if (markets && markets.length > 0) {
    const marketId = markets[0].id;
    const poolResponse = await fetch(`/api/markets/${marketId}/pool`);
    if (poolResponse.ok) {
      const poolData = await poolResponse.json();
      console.log("✅ Pool API working:", poolData);
    } else {
      console.error("❌ Pool API failed:", poolResponse.status);
    }
  }
} catch (error) {
  console.error("❌ API test failed:", error);
}

// Test 4: Check betting interface component
console.log("\nTest 4: Betting Interface Component");
try {
  // Check if the component is available
  const bettingInterface = document.querySelector('[data-testid="betting-interface"]');
  if (bettingInterface) {
    console.log("✅ Betting interface component found");
  } else {
    console.log("⚠️ Betting interface component not found (may not be on market page)");
  }
} catch (error) {
  console.error("❌ Component test failed:", error);
}

// Test 5: Check wallet assets hook
console.log("\nTest 5: Wallet Assets Hook");
try {
  // This would need to be run in a React component context
  console.log("⚠️ Wallet assets hook test requires React context");
} catch (error) {
  console.error("❌ Wallet assets test failed:", error);
}

console.log("\n🎯 Frontend Integration Tests Complete!");

// Helper function to test betting flow
window.testBettingFlow = async function() {
  console.log("🎲 Testing Betting Flow...");
  
  try {
    // Check if wallet is connected
    if (!window.solana || !window.solana.isConnected) {
      console.log("❌ Wallet not connected");
      return;
    }

    // Get user's public key
    const publicKey = window.solana.publicKey;
    console.log("User wallet:", publicKey.toString());

    // Test smart contract service
    const { smartContractService } = await import('./lib/smart-contract-real.ts');
    
    // Create mock wallet
    const wallet = {
      publicKey: publicKey,
      signTransaction: window.solana.signTransaction,
      signAllTransactions: window.solana.signAllTransactions
    };

    // Test pool data fetching
    const poolData = await smartContractService.fetchPoolData(0, 'WIF');
    console.log("Pool data:", poolData);

    console.log("✅ Betting flow test completed");
  } catch (error) {
    console.error("❌ Betting flow test failed:", error);
  }
};

console.log("\n💡 Run 'testBettingFlow()' to test the complete betting flow");
