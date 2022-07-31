use crate::error::InglError;
use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};
use solana_program::{
    borsh::try_from_slice_unchecked, native_token::LAMPORTS_PER_SOL,
    program_error::ProgramError, pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
pub mod constants{
    use solana_program::declare_id;
    declare_id!("BiHKsjuDLufe6pq2m3neye7yuv4zNN5jK7hixQD35Di8");


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
    pub const BTC_FEED_PUBLIC_KEY: &str = "9ATrvi6epR5hVYtwNs7BB7VCiYnd4WM7e8MfafWpfiXC";
    pub const SOL_FEED_PUBLIC_KEY: &str = "7LLvRhMs73FqcLkA8jvEE1AM2mYZXTmqfUv8GAEurymx";
    pub const ETH_FEED_PUBLIC_KEY: &str = "6fhxFvPocWapZ5Wa2miDnrX2jYRFKvFqYnX11GGkBo2f";
    pub const BNB_FEED_PUBLIC_KEY: &str = "DR6PqK15tD21MEGSLmDpXwLA7Fw47kwtdZeUMdT7vd7L";
    pub const PD_POOL_KEY: &str = "pd_pool";

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

#[derive(BorshDeserialize, BorshSerialize)]
pub struct GlobalGems {
    pub counter: u32,
    pub total_raised: u64,
    pub pd_pool_total: u64,
    pub delegated_total: u64,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum FundsLocation {
    MintingPool,
    PDPool,
    VoteAccount { id: Pubkey },
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct PriceTime {}

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

pub struct VoteState{}

impl VoteState {
    pub fn space()->usize{
        3731
    }
    pub fn min_lamports()->u64{
        Rent::get().unwrap().minimum_balance(3731)
    }
}
