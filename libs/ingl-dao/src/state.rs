use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{borsh::try_from_slice_unchecked, native_token::LAMPORTS_PER_SOL, program_error::ProgramError, pubkey::Pubkey};

use crate::error::InglError;
pub mod constants{
    pub const INGL_REALM_NAME: &str = "ingl_dao";
    pub const GOVERNANCE_PROGRAM_SEED: &str = "ingl_dao";
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
    pub redeemable_data: u32,
    pub numeration: u32,
    pub rarity: Option<Rarity>,
    pub funds_location: FundsLocation,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub enum GemAccountVersions{
    GemAccountV0_0_1,
    BlankCase,
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
                Err(InglError::InvalidStructType.utilize("GemAccountVerssions deserialize"))}
        }

    }
}


