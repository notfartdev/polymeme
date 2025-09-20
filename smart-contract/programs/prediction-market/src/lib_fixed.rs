use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("YourProgramIdHere"); // Replace with your actual program ID

// Constants
pub const GLOBAL_SEED: &str = "global";
pub const MARKET_SEED: &str = "market";
pub const POSITION_SEED: &str = "position";
pub const BET_SEED: &str = "bet";

// Platform fee (2.5%)
pub const PLATFORM_FEE_BASIS_POINTS: u16 = 250;

#[program]
pub mod prediction_market {
    use super::*;

    // Initialize the global state
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

    // Create a new prediction market
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

    // Place a bet on the market (allows multiple bets per user)
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        side: BetSide,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let position = &mut ctx.accounts.position;
        let bet = &mut ctx.accounts.bet;
        let global = &mut ctx.accounts.global;

        // Check if market is still active
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::MarketNotActive
        );

        // Check if market hasn't closed
        require!(
            Clock::get()?.unix_timestamp < market.closing_time,
            ErrorCode::MarketClosed
        );

        // Verify the user is using the correct token for this market
        require!(
            ctx.accounts.user_token_account.mint == market.required_token_mint,
            ErrorCode::WrongToken
        );

        // Calculate platform fee
        let fee_amount = (amount * PLATFORM_FEE_BASIS_POINTS as u64) / 10000;
        let bet_amount = amount - fee_amount;

        // Initialize or update position
        if position.market == Pubkey::default() {
            // First bet for this user on this market
            position.market = market.key();
            position.user = ctx.accounts.user.key();
            position.yes_amount = 0;
            position.no_amount = 0;
            position.bump = ctx.bumps.position;
        }

        // Update position based on side
        match side {
            BetSide::Yes => {
                position.yes_amount += bet_amount;
            }
            BetSide::No => {
                position.no_amount += bet_amount;
            }
        }

        // Initialize bet record
        bet.market = market.key();
        bet.user = ctx.accounts.user.key();
        bet.amount = bet_amount;
        bet.side = side;
        bet.timestamp = Clock::get()?.unix_timestamp;
        bet.bump = ctx.bumps.bet;

        // Transfer tokens to market (including fee)
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.market_token_account.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, amount)?;

        // Transfer fee to platform
        if fee_amount > 0 {
            let fee_transfer_instruction = Transfer {
                from: ctx.accounts.market_token_account.to_account_info(),
                to: ctx.accounts.platform_token_account.to_account_info(),
            };

            let fee_cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                fee_transfer_instruction,
            );

            token::transfer(fee_cpi_ctx, fee_amount)?;
        }

        // Update market pools
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

        global.total_volume += amount;
        global.total_fees_collected += fee_amount;

        msg!("Bet placed: {} {} tokens on {:?} (fee: {})", bet_amount, market.required_token_symbol, side, fee_amount);
        Ok(())
    }

    // Resolve market (call this after market closes)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        result: BetSide,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        // Check if market is closed
        require!(
            Clock::get()?.unix_timestamp >= market.closing_time,
            ErrorCode::MarketNotClosed
        );

        // Check if market is still active
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::MarketNotActive
        );

        market.result = Some(result);
        market.status = MarketStatus::Resolved;

        msg!("Market resolved with result: {:?}", result);
        Ok(())
    }

    // Claim winnings for a specific bet
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let position = &mut ctx.accounts.position;
        let bet = &ctx.accounts.bet;

        // Check if market is resolved
        require!(
            market.status == MarketStatus::Resolved,
            ErrorCode::MarketNotResolved
        );

        // Check if user bet on the winning side
        require!(
            market.result == Some(bet.side),
            ErrorCode::NotWinningBet
        );

        // Check if bet hasn't been claimed yet
        require!(
            !bet.claimed,
            ErrorCode::AlreadyClaimed
        );

        // Calculate winnings (proportional to bet size within winning pool)
        let total_pool = market.yes_pool + market.no_pool;
        let winning_pool = match bet.side {
            BetSide::Yes => market.yes_pool,
            BetSide::No => market.no_pool,
        };

        let winnings = (total_pool * bet.amount) / winning_pool;

        // Transfer winnings to user
        let transfer_instruction = Transfer {
            from: ctx.accounts.market_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, winnings)?;

        // Mark bet as claimed
        let bet_account = &mut ctx.accounts.bet;
        bet_account.claimed = true;

        // Update position (reduce the claimed amount)
        match bet.side {
            BetSide::Yes => {
                position.yes_amount = position.yes_amount.saturating_sub(bet.amount);
            }
            BetSide::No => {
                position.no_amount = position.no_amount.saturating_sub(bet.amount);
            }
        }

        msg!("Winnings claimed: {} tokens for bet amount: {}", winnings, bet.amount);
        Ok(())
    }

    // Claim all winnings for a user's position in a market
    pub fn claim_all_winnings(ctx: Context<ClaimAllWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let position = &mut ctx.accounts.position;

        // Check if market is resolved
        require!(
            market.status == MarketStatus::Resolved,
            ErrorCode::MarketNotResolved
        );

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

        // Transfer total winnings to user
        let transfer_instruction = Transfer {
            from: ctx.accounts.market_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, total_winnings)?;

        msg!("All winnings claimed: {} tokens", total_winnings);
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Global::INIT_SPACE,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump
    )]
    pub global: Account<'info, Global>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [MARKET_SEED.as_bytes(), global.market_count.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump = global.bump
    )]
    pub global: Account<'info, Global>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, side: BetSide)]
pub struct PlaceBet<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Bet::INIT_SPACE,
        seeds = [BET_SEED.as_bytes(), market.key().as_ref(), user.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED.as_bytes(), market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [MARKET_SEED.as_bytes(), market.id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump = global.bump
    )]
    pub global: Account<'info, Global>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = market
    )]
    pub market_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = global.authority
    )]
    pub platform_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [MARKET_SEED.as_bytes(), market.id.to_le_bytes().as_ref()],
        bump = market.bump,
        constraint = market.creator == resolver.key()
    )]
    pub market: Account<'info, Market>,
    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        seeds = [MARKET_SEED.as_bytes(), market.id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [POSITION_SEED.as_bytes(), market.key().as_ref(), user.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
    #[account(
        mut,
        seeds = [BET_SEED.as_bytes(), market.key().as_ref(), user.key().as_ref(), &bet.timestamp.to_le_bytes()],
        bump = bet.bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = market
    )]
    pub market_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct ClaimAllWinnings<'info> {
    #[account(
        seeds = [MARKET_SEED.as_bytes(), market.id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [POSITION_SEED.as_bytes(), market.key().as_ref(), user.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = market.required_token_mint,
        associated_token::authority = market
    )]
    pub market_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

// Data structures
#[account]
pub struct Global {
    pub authority: Pubkey,
    pub market_count: u64,
    pub total_volume: u64,
    pub total_fees_collected: u64,
    pub bump: u8,
}

impl Global {
    pub const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Market {
    pub id: u64,
    pub creator: Pubkey,
    pub question: String,
    pub description: String,
    pub closing_time: i64,
    pub required_token_mint: Pubkey,
    pub required_token_symbol: String,
    pub required_token_name: String,
    pub status: MarketStatus,
    pub yes_pool: u64,
    pub no_pool: u64,
    pub yes_bets: u64,
    pub no_bets: u64,
    pub result: Option<BetSide>,
    pub bump: u8,
}

impl Market {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 4 + 200 + 4 + 200 + 8 + 32 + 4 + 20 + 4 + 50 + 1 + 8 + 8 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct Position {
    pub market: Pubkey,
    pub user: Pubkey,
    pub yes_amount: u64,
    pub no_amount: u64,
    pub bump: u8,
}

impl Position {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + 8 + 1;
}

#[account]
pub struct Bet {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub side: BetSide,
    pub timestamp: i64,
    pub claimed: bool,
    pub bump: u8,
}

impl Bet {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + 1 + 8 + 1 + 1;
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Active,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BetSide {
    Yes,
    No,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Market is not active")]
    MarketNotActive,
    #[msg("Market is closed")]
    MarketClosed,
    #[msg("Market is not closed yet")]
    MarketNotClosed,
    #[msg("Market is not resolved")]
    MarketNotResolved,
    #[msg("This bet is not on the winning side")]
    NotWinningBet,
    #[msg("Wrong token - this market only accepts the specified token")]
    WrongToken,
    #[msg("Bet has already been claimed")]
    AlreadyClaimed,
    #[msg("No winnings to claim")]
    NoWinningsToClaim,
}
