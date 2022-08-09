use crate::error::InglError;
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use solana_program::{
    borsh::try_from_slice_unchecked, native_token::LAMPORTS_PER_SOL,
    program_error::ProgramError, pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
pub mod constants{
    use solana_program::{declare_id, native_token::LAMPORTS_PER_SOL};
    declare_id!("Gt22mK6p26CGDU6b545bvVgwqiyb1dTGkGQ7aeHwvaTQ");


    pub const INGL_TREASURY_ACCOUNT_KEY: &str = "ingl_treasury_account_key";
    pub const INGL_NFT_COLLECTION_KEY: &str = "ingl_nft_collection_newer";
    pub const INGL_MINT_AUTHORITY_KEY: &str = "mint_authority";
    pub const INGL_MINTING_POOL_KEY: &str = "minting_pool";
    pub const COLLECTION_HOLDER_KEY: &str = "collection_holder";
    pub const GLOBAL_GEM_KEY: &str = "global_gem_account";
    pub const GEM_ACCOUNT_CONST: &str = "gem_account";
    pub const FEE_MULTIPLYER: u8 = 10;
    pub const PRICE_TIME_INTERVAL: u8 = 20;
    pub const TREASURY_FEE_MULTIPLYER: u8 = 70;
    pub const MAXIMUM_DELEGATABLE_STAKE: u64 = 10000*LAMPORTS_PER_SOL;
    pub const BTC_FEED_PUBLIC_KEY: &str = "9ATrvi6epR5hVYtwNs7BB7VCiYnd4WM7e8MfafWpfiXC";
    pub const SOL_FEED_PUBLIC_KEY: &str = "7LLvRhMs73FqcLkA8jvEE1AM2mYZXTmqfUv8GAEurymx";
    pub const ETH_FEED_PUBLIC_KEY: &str = "6fhxFvPocWapZ5Wa2miDnrX2jYRFKvFqYnX11GGkBo2f";
    pub const BNB_FEED_PUBLIC_KEY: &str = "DR6PqK15tD21MEGSLmDpXwLA7Fw47kwtdZeUMdT7vd7L";
    pub const PD_POOL_KEY: &str = "pd_pool";
    pub const PROPOSAL_KEY: &str ="ingl_proposals";
    pub const COUNCIL_MINT_KEY: &str = "council_mint";
    pub const COUNCIL_MINT_AUTHORITY_KEY: &str = "council_mint_authority";
    pub const AUTHORIZED_WITHDRAWER_KEY: &str = "InglAuthorizedWithdrawer";
    pub const VOTE_ACCOUNT_KEY: &str = "InglVote";
    pub const VOTE_DATA_ACCOUNT_KEY: &str = "InglVoteData";
    pub const STAKE_ACCOUNT_KEY: &str = "staking_account_key";
    pub const TREASURY_ACCOUNT_KEY: &str = "Treasury_account_key";

    pub const VALIDATOR_ID_SHARE: u64 = 15;
    pub const TREASURY_SHARE: u64 = 13;
    pub const TEAM_SHARE: u64 = 12;
    pub const NFTS_SHARE: u64 = 60;

    pub mod spl_program{
        use solana_program::declare_id;
        declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    }
    pub mod metaplex{
        use solana_program::declare_id;
        declare_id!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    }
    pub mod associated_token_program{
        use solana_program::declare_id;

        declare_id!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    }

    pub mod vote_program{
        solana_program::declare_id!("Vote111111111111111111111111111111111111111");
    }
}



#[derive(BorshDeserialize, BorshSerialize, Copy, Clone, Serialize, Deserialize)]
pub struct VoteInit {
    pub node_pubkey: Pubkey,
    pub authorized_voter: Pubkey,
    pub authorized_withdrawer: Pubkey,
    pub commission: u8,
}


#[derive(BorshSerialize, Copy, Clone, BorshDeserialize)]
pub enum Class {
    Ruby,
    Diamond,
    Sapphire,
    Emerald,
    Serendibite,
    Benitoite,
}

impl Class {
    pub fn get_class_lamports(self) -> u64 {
        LAMPORTS_PER_SOL
            * match self {
                Self::Ruby => 500,
                Self::Diamond => 100,
                Self::Sapphire => 50,
                Self::Emerald => 10,
                Self::Serendibite => 5,
                Self::Benitoite => 1,
            }
    }
}

#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub enum Rarity {
    Common,
    Uncommon,
    Rare,
    Exalted,
    Mythic,
}

#[derive(BorshDeserialize, Clone, BorshSerialize)]
pub struct GlobalGems {
    pub counter: u32,
    pub total_raised: u64,
    pub pd_pool_total: u64,
    pub delegated_total: u64,
    pub dealloced_total: u64,
    pub is_proposal_ongoing: bool,
    pub proposal_numeration: u32,
    pub validator_list : Vec<Pubkey>,//This is not the validator list to display for proposals
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum FundsLocation {
    MintingPool,
    PDPool,
    VoteAccount { vote_account_id: Pubkey},
}


#[derive(BorshDeserialize, BorshSerialize)]
pub struct ValidatorVote{
    pub proposal_id: Pubkey,
    pub validator_index: u32,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct GemAccountV0_0_1 {
    pub struct_id: GemAccountVersions,
    pub date_created: u32,
    pub class: Class,
    pub redeemable_date: u32,
    pub numeration: u32,
    pub rarity: Option<Rarity>,
    pub funds_location: FundsLocation,
    pub rarity_seed_time: Option<u32>,
    pub date_allocated: Option<u32>,
    pub last_voted_proposal: Option<Pubkey>,
    pub last_withdrawal_epoch: Option<u64>,
    pub last_delegation_epoch: Option<u64>,
    pub all_withdraws: Vec<u64>,
    pub all_votes: Vec<ValidatorVote>,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum GemAccountVersions {
    GemAccountV0_0_1,
    BlanckCase
}
impl GemAccountVersions {
    pub fn decode<T: BorshDeserialize>(data: &[u8]) -> Result<T, ProgramError> {
        let version: GemAccountVersions = try_from_slice_unchecked(&data[0..1]).unwrap();
        match version {
            GemAccountVersions::GemAccountV0_0_1 => {
                //Change the code here to represent the conversion to the appropriate version you expect.
                let a: T = try_from_slice_unchecked(data).unwrap();
                Ok(a)
            }
            // GemAccountVersions::AnotherOption => {
            //  Do Something in Here to convert data to the appropriate struct to return
            // }
            _ => {
                Err(InglError::InvalidStructType.utilize(Some("GemAccountVersions deserialize")))}
        }
    }
}


#[derive(BorshDeserialize, BorshSerialize)]
pub struct ValidatorProposal{
    pub validator_ids: Vec<Pubkey>,
    pub date_created: u32,
    pub date_finalized: Option<u32>,
    pub votes: Vec<u32>,
    pub winner: Option<Pubkey>
}


#[derive(BorshDeserialize, BorshSerialize)]
pub struct ProgramVoteAccount{
    total_delegated: u64,
    validator: Pubkey,
}

#[derive(BorshDeserialize, Copy, Clone, BorshSerialize)]
pub struct VoteRewards{
    pub epoch_number: u64,
    pub total_reward: u64,
    pub total_stake: u64,
}
#[derive(BorshDeserialize, BorshSerialize)]
pub struct InglVoteAccountData{
    pub total_delegated: u64,
    pub last_withdraw_epoch: u64,
    pub dealloced: u64,
    pub validator_id: Pubkey, //To Reconsider.
    pub vote_rewards: Vec<VoteRewards>,
}

pub struct VoteState{}
impl VoteState {
    pub fn space()->usize{
        3731
    }
    pub fn min_lamports()->u64{
        Rent::get().unwrap().minimum_balance(3731)
    }
}
