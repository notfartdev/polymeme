import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("prediction-market", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const provider = anchor.getProvider();

  // Test accounts
  let globalPDA: PublicKey;
  let globalBump: number;
  let marketPDA: PublicKey;
  let marketBump: number;
  let positionPDA: PublicKey;
  let positionBump: number;
  let betPDA: PublicKey;
  let betBump: number;

  // Test users
  let user1: Keypair;
  let user2: Keypair;
  let authority: Keypair;

  // Test token
  let testTokenMint: PublicKey;
  let user1TokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;
  let marketTokenAccount: PublicKey;
  let platformTokenAccount: PublicKey;

  before(async () => {
    // Generate test keypairs
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    authority = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(user1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait for airdrops to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create test token mint
    testTokenMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6 // 6 decimals
    );

    // Create token accounts
    user1TokenAccount = await getAssociatedTokenAddress(testTokenMint, user1.publicKey);
    user2TokenAccount = await getAssociatedTokenAddress(testTokenMint, user2.publicKey);
    marketTokenAccount = await getAssociatedTokenAddress(testTokenMint, marketPDA);
    platformTokenAccount = await getAssociatedTokenAddress(testTokenMint, authority.publicKey);

    // Create user token accounts
    await createAccount(provider.connection, user1, testTokenMint, user1.publicKey);
    await createAccount(provider.connection, user2, testTokenMint, user2.publicKey);

    // Mint test tokens to users
    await mintTo(provider.connection, authority, testTokenMint, user1TokenAccount, authority, 1000 * 10**6); // 1000 tokens
    await mintTo(provider.connection, authority, testTokenMint, user2TokenAccount, authority, 1000 * 10**6); // 1000 tokens

    // Get PDAs
    [globalPDA, globalBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );
  });

  it("Initializes the global state", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        global: globalPDA,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    console.log("Initialize transaction:", tx);

    // Fetch the global state
    const globalState = await program.account.global.fetch(globalPDA);
    expect(globalState.authority.toString()).to.equal(authority.publicKey.toString());
    expect(globalState.marketCount.toNumber()).to.equal(0);
    expect(globalState.totalVolume.toNumber()).to.equal(0);
    expect(globalState.totalFeesCollected.toNumber()).to.equal(0);
  });

  it("Creates a new market", async () => {
    const closingTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

    [marketPDA, marketBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .createMarket(
        "Will WIF hit $10 by end of 2024?",
        "Test market for WIF token price prediction",
        new anchor.BN(closingTime),
        testTokenMint,
        "WIF",
        "dogwifhat"
      )
      .accounts({
        market: marketPDA,
        global: globalPDA,
        creator: user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    console.log("Create market transaction:", tx);

    // Fetch the market
    const market = await program.account.market.fetch(marketPDA);
    expect(market.id.toNumber()).to.equal(0);
    expect(market.creator.toString()).to.equal(user1.publicKey.toString());
    expect(market.question).to.equal("Will WIF hit $10 by end of 2024?");
    expect(market.requiredTokenMint.toString()).to.equal(testTokenMint.toString());
    expect(market.yesPool.toNumber()).to.equal(0);
    expect(market.noPool.toNumber()).to.equal(0);
  });

  it("Places a bet on YES", async () => {
    const betAmount = 100 * 10**6; // 100 tokens
    const timestamp = Math.floor(Date.now() / 1000);

    [betPDA, betBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPDA.toBuffer(), user1.publicKey.toBuffer(), new anchor.BN(timestamp).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [positionPDA, positionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), marketPDA.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    // Create market token account
    await createAccount(provider.connection, user1, testTokenMint, marketPDA);

    const tx = await program.methods
      .placeBet(
        new anchor.BN(betAmount),
        { yes: {} }
      )
      .accounts({
        bet: betPDA,
        position: positionPDA,
        market: marketPDA,
        global: globalPDA,
        user: user1.publicKey,
        userTokenAccount: user1TokenAccount,
        marketTokenAccount: marketTokenAccount,
        platformTokenAccount: platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    console.log("Place bet transaction:", tx);

    // Fetch the bet
    const bet = await program.account.bet.fetch(betPDA);
    expect(bet.user.toString()).to.equal(user1.publicKey.toString());
    expect(bet.amount.toNumber()).to.equal(97500000); // 97.5 tokens (after 2.5% fee)
    expect(bet.side).to.deep.equal({ yes: {} });
    expect(bet.claimed).to.be.false;

    // Fetch the position
    const position = await program.account.position.fetch(positionPDA);
    expect(position.user.toString()).to.equal(user1.publicKey.toString());
    expect(position.yesAmount.toNumber()).to.equal(97500000); // 97.5 tokens
    expect(position.noAmount.toNumber()).to.equal(0);

    // Fetch the market
    const market = await program.account.market.fetch(marketPDA);
    expect(market.yesPool.toNumber()).to.equal(97500000); // 97.5 tokens
    expect(market.noPool.toNumber()).to.equal(0);
    expect(market.yesBets.toNumber()).to.equal(1);
    expect(market.noBets.toNumber()).to.equal(0);

    // Fetch the global state
    const globalState = await program.account.global.fetch(globalPDA);
    expect(globalState.totalVolume.toNumber()).to.equal(100000000); // 100 tokens
    expect(globalState.totalFeesCollected.toNumber()).to.equal(2500000); // 2.5 tokens
  });

  it("Places a bet on NO", async () => {
    const betAmount = 50 * 10**6; // 50 tokens
    const timestamp = Math.floor(Date.now() / 1000) + 1;

    [betPDA, betBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPDA.toBuffer(), user2.publicKey.toBuffer(), new anchor.BN(timestamp).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [positionPDA, positionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), marketPDA.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .placeBet(
        new anchor.BN(betAmount),
        { no: {} }
      )
      .accounts({
        bet: betPDA,
        position: positionPDA,
        market: marketPDA,
        global: globalPDA,
        user: user2.publicKey,
        userTokenAccount: user2TokenAccount,
        marketTokenAccount: marketTokenAccount,
        platformTokenAccount: platformTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    console.log("Place NO bet transaction:", tx);

    // Fetch the market
    const market = await program.account.market.fetch(marketPDA);
    expect(market.yesPool.toNumber()).to.equal(97500000); // 97.5 tokens
    expect(market.noPool.toNumber()).to.equal(48750000); // 48.75 tokens (after fee)
    expect(market.yesBets.toNumber()).to.equal(1);
    expect(market.noBets.toNumber()).to.equal(1);
  });

  it("Resolves the market", async () => {
    const tx = await program.methods
      .resolveMarket({ yes: {} })
      .accounts({
        market: marketPDA,
        resolver: user1.publicKey, // Market creator
      })
      .signers([user1])
      .rpc();

    console.log("Resolve market transaction:", tx);

    // Fetch the market
    const market = await program.account.market.fetch(marketPDA);
    expect(market.status).to.deep.equal({ resolved: {} });
    expect(market.result).to.deep.equal({ yes: {} });
  });

  it("Claims winnings", async () => {
    const timestamp = Math.floor(Date.now() / 1000);

    [betPDA, betBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPDA.toBuffer(), user1.publicKey.toBuffer(), new anchor.BN(timestamp).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .claimWinnings()
      .accounts({
        market: marketPDA,
        position: positionPDA,
        bet: betPDA,
        user: user1.publicKey,
        userTokenAccount: user1TokenAccount,
        marketTokenAccount: marketTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    console.log("Claim winnings transaction:", tx);

    // Fetch the bet to verify it's claimed
    const bet = await program.account.bet.fetch(betPDA);
    expect(bet.claimed).to.be.true;
  });
});