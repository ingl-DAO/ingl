use solana_program::{program_error::ProgramError, msg};
use thiserror::Error;
use num_derive::FromPrimitive;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum InglError{
    #[error("Provided Keypairs do not match.")]
    KeyPairMismatch,

    #[error("Provided Struct Type does not match expected value")]
    InvalidStructType,

    #[error("Funds Not located in the appropriate pool for this instruction")]
    InvalidFundsLocation,

    #[error("Attemptint to execute earlier than allowed instruction")]
    TooEarly
}


impl From<InglError> for ProgramError {
    fn from(e: InglError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl InglError{
    pub fn utilize(self, keyword:Option<&str>)->ProgramError{
        match self {
            Self::InvalidStructType => {
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Provided Struct Type does not match expected value.", keyword);}}
            Self::KeyPairMismatch => {msg!("Error:  Provided Keypairs do not match expected value");}
            Self::InvalidFundsLocation => {
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Funds Not located in the appropriate pool for this instruction", keyword);}
            }
            Self::TooEarly => {
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Executing a process earlier than is allowed", keyword);}
            }
        }
        ProgramError::from(self)
    }
}