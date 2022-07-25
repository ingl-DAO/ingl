use solana_program::{program_error::ProgramError, msg};
use thiserror::Error;
use num_derive::FromPrimitive;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum InglError{
    #[error("Provided Keypairs do not match.")]
    KeyPairMismatch,

    #[error("Provided Struct Type does not match expected value")]
    InvalidStructType,
}


impl From<InglError> for ProgramError {
    fn from(e: InglError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl InglError{
    pub fn utilize(self, keyword: &str)->ProgramError{
        match self {
            Self::InvalidStructType => {msg!("Error:  Keyword: {:?}, Provided Struct Type does not match expected value.", keyword);}
            Self::KeyPairMismatch => {msg!("Error:  Keyword: {:?}, Provided Keypairs do not match expected value", keyword);}
        }
        ProgramError::from(self)
    }
}