use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::borsh::try_from_slice_unchecked;

use crate::state::Class;

#[derive(BorshSerialize, BorshDeserialize)]
pub enum InstructionEnum {
    MintNft(Class),
    MintNewCollection,
    Redeem,
    ImprintRarity,
    AllocateSol,
    DeAllocateSol,
    DelegateSol,
    UnDelegateSol,
}


impl InstructionEnum {
    pub fn decode(data: &[u8]) -> Self {
        try_from_slice_unchecked(data).unwrap()
    }
}