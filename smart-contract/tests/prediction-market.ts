import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { expect } from "chai";

describe("prediction-market", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const provider = anchor.getProvider();

  // Test accounts
  let globalPda: PublicKey;
  let marketPda: PublicKey;
  let betPda: PublicKey;
  let user = Keypair.generate();
  let creator = Keypair.generate();
  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let marketTokenAccount: PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(creator.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      9
    );

    // Create token accounts
    userTokenAccount = await createAccount(
      provider.connection,
      user,
      tokenMint,
      user.publicKey
    );

    marketTokenAccount = await createAccount(
      provider.connection,
      user,
      tokenMint,
      user.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      user,
      tokenMint,
      userTokenAccount,
      user,
      1000 * 10**9 // 1000 tokens
    );
  });

  it("Initialize global state", async () => {
    [globalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );

    const tx = await program.methods
      .initialize()
      .accounts({
        global: globalPda,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction signature", tx);

    const globalAccount = await program.account.global.fetch(globalPda);
    expect(globalAccount.authority.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(globalAccount.marketCount.toNumber()).to.equal(0);
  });

  it("Create a market", async () => {
    [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), new anchor.BN(0).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const tx = await program.methods
      .createMarket(
        "Will Bitcoin reach $100k by end of 2024?",
        "This market will resolve based on Bitcoin's price at the end of 2024",
        new anchor.BN(Date.now() / 1000 + 86400), // 24 hours from now
        tokenMint,
        "WIF", // Token symbol
        "dogwifhat" // Token name
      )
      .accounts({
        market: marketPda,
        global: globalPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    console.log("Create market transaction signature", tx);

    const marketAccount = await program.account.market.fetch(marketPda);
    expect(marketAccount.question).to.equal("Will Bitcoin reach $100k by end of 2024?");
    expect(marketAccount.creator.toString()).to.equal(creator.publicKey.toString());
    expect(marketAccount.requiredTokenSymbol).to.equal("WIF");
    expect(marketAccount.requiredTokenName).to.equal("dogwifhat");
    expect(marketAccount.yesPool.toNumber()).to.equal(0);
    expect(marketAccount.noPool.toNumber()).to.equal(0);
  });

  it("Place a YES bet", async () => {
    [betPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        marketPda.toBuffer(),
        user.publicKey.toBuffer(),
        Buffer.from("yes")
      ],
      program.programId
    );

    const betAmount = new anchor.BN(100 * 10**9); // 100 tokens

    const tx = await program.methods
      .placeBet(betAmount, { yes: {} })
      .accounts({
        bet: betPda,
        market: marketPda,
        global: globalPda,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        marketTokenAccount: marketTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Place bet transaction signature", tx);

    const betAccount = await program.account.bet.fetch(betPda);
    expect(betAccount.amount.toNumber()).to.equal(betAmount.toNumber());
    expect(betAccount.side).to.deep.equal({ yes: {} });

    const marketAccount = await program.account.market.fetch(marketPda);
    expect(marketAccount.yesPool.toNumber()).to.equal(betAmount.toNumber());
    expect(marketAccount.yesBets.toNumber()).to.equal(1);
  });

  it("Place a NO bet", async () => {
    const noBetPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        marketPda.toBuffer(),
        user.publicKey.toBuffer(),
        Buffer.from("no")
      ],
      program.programId
    )[0];

    const betAmount = new anchor.BN(50 * 10**9); // 50 tokens

    const tx = await program.methods
      .placeBet(betAmount, { no: {} })
      .accounts({
        bet: noBetPda,
        market: marketPda,
        global: globalPda,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        marketTokenAccount: marketTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Place NO bet transaction signature", tx);

    const marketAccount = await program.account.market.fetch(marketPda);
    expect(marketAccount.noPool.toNumber()).to.equal(betAmount.toNumber());
    expect(marketAccount.noBets.toNumber()).to.equal(1);
  });

  it("Resolve market", async () => {
    const tx = await program.methods
      .resolveMarket({ yes: {} })
      .accounts({
        market: marketPda,
        resolver: creator.publicKey,
      })
      .signers([creator])
      .rpc();

    console.log("Resolve market transaction signature", tx);

    const marketAccount = await program.account.market.fetch(marketPda);
    expect(marketAccount.result).to.deep.equal({ yes: {} });
  });

  it("Claim winnings", async () => {
    const tx = await program.methods
      .claimWinnings()
      .accounts({
        market: marketPda,
        bet: betPda,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        marketTokenAccount: marketTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log("Claim winnings transaction signature", tx);

    // Check that user received winnings
    // Total pool was 150 tokens, user bet 100 on YES, so they should get 150 tokens back
    const userTokenBalance = await provider.connection.getTokenAccountBalance(userTokenAccount);
    expect(userTokenBalance.value.amount).to.equal("150000000000"); // 150 tokens
  });

  it("Should fail when trying to bet with wrong token", async () => {
    // Create a different token mint
    const wrongTokenMint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      9
    );

    // Create token account for wrong token
    const wrongTokenAccount = await createAccount(
      provider.connection,
      user,
      wrongTokenMint,
      user.publicKey
    );

    // Try to place bet with wrong token - should fail
    try {
      await program.methods
        .placeBet(new anchor.BN(50 * 10**9), { yes: {} })
        .accounts({
          bet: betPda,
          market: marketPda,
          global: globalPda,
          user: user.publicKey,
          userTokenAccount: wrongTokenAccount, // Wrong token account
          marketTokenAccount: marketTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      // If we get here, the test should fail
      expect.fail("Should have failed with wrong token");
    } catch (error) {
      // This is expected - should fail with WrongToken error
      expect(error.message).to.include("Wrong token");
    }
  });
});
