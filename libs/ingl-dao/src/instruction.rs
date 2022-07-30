use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::borsh::try_from_slice_unchecked;
use spl_governance::state::governance::GovernanceConfig;

#[derive(BorshSerialize, BorshDeserialize)]
pub enum InstructionEnum {
    InitInglDao{ governance_config: GovernanceConfig}
}

impl InstructionEnum {
    pub fn decode(data: &[u8]) -> Self {
        try_from_slice_unchecked(data).unwrap()
    }
}