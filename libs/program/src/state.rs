use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{borsh::try_from_slice_unchecked, native_token::LAMPORTS_PER_SOL, program_error::ProgramError, pubkey::Pubkey};

use crate::error::InglError;
pub mod constants{
    pub const INGL_NFT_COLLECTION_KEY: &str = "ingl_nft_collection_newer";
    pub const INGL_MINT_AUTHORITY_KEY: &str = "mint_authority";
    pub const INGL_MINTING_POOL_KEY: &str = "minting_pool";
    pub const COLLECTION_HOLDER_KEY: &str = "collection_holder";
    pub const GLOBAL_GEM_KEY: &str = "global_gem_account";
    pub const GEM_ACCOUNT_CONST: &str = "gem_account";
    pub const PD_POOL_KEY: &str = "pd_pool";
}

#[derive(BorshSerialize,Copy, Clone, BorshDeserialize)]
pub enum Class {
    Ruby,
    Diamond,
    Sapphire,
    Emerald,
    Serendibite,
    Benitoite
}

impl Class {
    pub fn get_class_lamports(self)->u64{
        LAMPORTS_PER_SOL * match self {
            Self::Ruby => {500}
            Self::Diamond => {100}
            Self::Sapphire => {50}
            Self::Emerald => {10}
            Self::Serendibite => {5}
            Self::Benitoite => {1}
        }
    }
}


#[derive(BorshDeserialize, BorshSerialize)]
pub enum Rarity{
    Common,
    Uncommon,
    Rare,
    Exalted,
    Mythic,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct GlobalGems{
    pub counter: u32,
    pub total_raised: u64,
    pub pd_pool_total: u64,
    pub delegated_total: u64,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum FundsLocation{
    MintingPool,
    PDPool,
    VoteAccount{id:Pubkey}
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct GemAccountV0_0_1{
    pub struct_id: GemAccountVersions,
    pub date_created: u32,
    pub class: Class,
    pub redeemable_date: u32,
    pub numeration: u32,
    pub rarity: Option<Rarity>,
    pub funds_location: FundsLocation,
    pub date_allocated: Option<u32>,

}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum GemAccountVersions{
    GemAccountV0_0_1,
    BlanckCase
}
impl GemAccountVersions{
    pub fn decode<T: BorshDeserialize>(data: &[u8]) -> Result<T, ProgramError>{
        let version: GemAccountVersions = try_from_slice_unchecked(&data[0..1]).unwrap();
        match version{
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


