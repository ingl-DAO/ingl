use solana_program::{
    pubkey::Pubkey,
    program_error::ProgramError, account_info::AccountInfo, entrypoint::ProgramResult,
};
use crate::{
    error::InglError,
    state::constants,
};

pub fn assert_pubkeys_exactitude(a: &Pubkey, b: &Pubkey) -> ProgramResult {
    if a != b {
         Err(InglError::AddressMismatch.utilize(None))?
    }
    Ok(())

}

pub fn assert_owned_by(account_info: &AccountInfo, expected_owner: &Pubkey) ->ProgramResult {
    if account_info.owner != expected_owner {
        Err(ProgramError::IllegalOwner)?
    }
    Ok(())
}

pub fn assert_program_owned(account_info: &AccountInfo) -> ProgramResult {
    assert_owned_by(account_info, &constants::id())
}

pub fn assert_is_signer(account_info: &AccountInfo) -> ProgramResult{
    if !account_info.is_signer{
        Err(ProgramError::MissingRequiredSignature)?
    }
    Ok(())
}

pub fn assert_pda_input(seeds : &[&[u8]], account_info: &AccountInfo) -> (Pubkey, u8){
    let (pda_key, pda_bump) = Pubkey::find_program_address(seeds, &constants::id());
    assert_pubkeys_exactitude(&pda_key, account_info.key).unwrap();
    (pda_key, pda_bump)

}