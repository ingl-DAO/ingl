use solana_program::{
    pubkey::Pubkey,
    program_error::ProgramError,
};
use crate::{
    error::InglError,
};

pub fn compare_pubkeys(a: &Pubkey, b: &Pubkey) -> Result<(), ProgramError> {
    if a != b {
        return Err(InglError::KeyPairMismatch.utilize(None));
    }
    Ok(())

}

