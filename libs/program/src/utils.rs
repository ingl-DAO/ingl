use solana_program::{
    pubkey::Pubkey,
    program_error::ProgramError, account_info::AccountInfo,
};
use crate::{
    error::InglError,
    state::constants,
};

pub fn assert_pubkeys_exactitude(a: &Pubkey, b: &Pubkey) -> Result<(), ProgramError> {
    if a != b {
        return Err(InglError::KeyPairMismatch.utilize(None));
    }
    Ok(())

}

pub fn assert_owned_by(account_info: &AccountInfo, expected_owner: &Pubkey) ->Result<(), ProgramError> {
    if account_info.owner != expected_owner {
        Err(ProgramError::IllegalOwner)?
    }
    Ok(())
}

pub fn assert_program_owned(account_info: &AccountInfo) -> Result<(), ProgramError> {
    assert_owned_by(account_info, &constants::id())
}
