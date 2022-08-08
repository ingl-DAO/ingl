use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::{
    pubkey::Pubkey,
    instruction::{AccountMeta, Instruction}, system_instruction, sysvar, borsh::try_from_slice_unchecked,
};
use serde::{Deserialize, Serialize};

use crate::state::{VoteInit, Class, constants::vote_program, VoteState};

#[derive(BorshSerialize, BorshDeserialize)]
pub enum InstructionEnum {
    MintNft(Class),
    MintNewCollection,
    Redeem,
    ImprintRarity,
    AllocateNFT,
    DeAllocateNFT,
    CreateVoteAccount,
    ChangeVoteAccountsValidatorIdentity,
    DelegateNFT,
    UnDelegateNFT,
    InitRarityImprint,
    RegisterValidatorId,
    CreateValidatorSelectionProposal,
    VoteValidatorProposal{num_nfts: u8, validator_index: u32},
    FinalizeProposal,
    ValidatorWithdraw,
    NFTWithdraw{cnt: u32},
    InitUndelegation,
    ProcessRewards,
}


impl InstructionEnum {
    pub fn decode(data: &[u8]) -> Self {
        try_from_slice_unchecked(data).unwrap()
    }
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub enum VoteInstruction {
    /// Initialize a vote account
    ///
    /// # Account references
    ///   0. `[WRITE]` Uninitialized vote account
    ///   1. `[]` Rent sysvar
    ///   2. `[]` Clock sysvar
    ///   3. `[SIGNER]` New validator identity (node_pubkey)
    InitializeAccount(VoteInit),

    /// Withdraw some amount of funds
    ///
    /// # Account references
    ///   0. `[WRITE]` Vote account to withdraw from
    ///   1. `[WRITE]` Recipient account
    ///   2. `[SIGNER]` Withdraw authority
    Withdraw(u64),

    /// Update the vote account's validator identity (node_pubkey)
    ///
    /// # Account references
    ///   0. `[WRITE]` Vote account to be updated with the given authority public key
    ///   1. `[SIGNER]` New validator identity (node_pubkey)
    ///   2. `[SIGNER]` Withdraw authority
    UpdateValidatorIdentity,
}


pub fn vote_initialize_account(vote_pubkey: &Pubkey, vote_init: &VoteInit) -> Instruction {
    let account_metas = vec![
        AccountMeta::new(*vote_pubkey, false),
        AccountMeta::new_readonly(sysvar::rent::id(), false),
        AccountMeta::new_readonly(sysvar::clock::id(), false),
        AccountMeta::new_readonly(vote_init.node_pubkey, true),
    ];

    Instruction::new_with_bincode(
        vote_program::id(),
        &VoteInstruction::InitializeAccount(*vote_init),
        account_metas,
    )
}

pub fn vote_create_account(
    from_pubkey: &Pubkey,
    vote_pubkey: &Pubkey,
) -> Instruction {
    let space = VoteState::space() as u64;
    let create_ix =
        system_instruction::create_account(from_pubkey, vote_pubkey, VoteState::min_lamports(), space, &vote_program::id());
    create_ix
}


pub fn vote_update_validator_identity(
    vote_pubkey: &Pubkey,
    authorized_withdrawer_pubkey: &Pubkey,
    node_pubkey: &Pubkey,
) -> Instruction {
    let account_metas = vec![
        AccountMeta::new(*vote_pubkey, false),
        AccountMeta::new_readonly(*node_pubkey, true),
        AccountMeta::new_readonly(*authorized_withdrawer_pubkey, true),
    ];

    Instruction{
        program_id: vote_program::id(),
        data: VoteInstruction::UpdateValidatorIdentity.try_to_vec().unwrap(),
        accounts: account_metas,
    }
}

pub fn vote_withdraw(
    vote_pubkey: &Pubkey,
    authorized_withdrawer_pubkey: &Pubkey,
    lamports: u64,
    to_pubkey: &Pubkey,
) -> Instruction {
    let account_metas = vec![
        AccountMeta::new(*vote_pubkey, false),
        AccountMeta::new(*to_pubkey, false),
        AccountMeta::new_readonly(*authorized_withdrawer_pubkey, true),
    ];

    Instruction{
        program_id: vote_program::id(),
        data: VoteInstruction::Withdraw(lamports).try_to_vec().unwrap(),
        accounts: account_metas
    }
}