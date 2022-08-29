use solana_program::{program_error::ProgramError, msg};
use thiserror::Error;
use num_derive::FromPrimitive;

#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum InglError{
    #[error("Provided Keypairs do not match.")]
    AddressMismatch,

    #[error("Provided Struct Type does not match expected value")]
    InvalidStructType,

    #[error("Funds Not located in the appropriate pool for this instruction")]
    InvalidFundsLocation,

    #[error("Attempting to execute an instruction earlier than allowe")]
    TooEarly,

    #[error("Attempting to execute an instruction later than allowed")]
    TooLate,

    #[error("A vote had already occured with the specifid accounts")]
    AlreadyVoted,

    #[error("A certain operation yielded a value beyond bounds")]
    BeyondBounds,

    #[error("Account data validation failed")]
    InvalidValPhrase,
}


impl From<InglError> for ProgramError {
    fn from(e: InglError) -> Self {
        e.to_string();
        ProgramError::Custom(e as u32)
    }
}

impl InglError{
    pub fn utilize(self, keyword:Option<&str>)->ProgramError{
        match self {
            Self::InvalidStructType => {
                msg!("Error:  keyword={:?} Provided Struct Type does not match expected value.", if let Some(key) = keyword{key} else {""});}
            Self::AddressMismatch => {msg!("Error:  Provided address do not match expected value");}
            Self::InvalidFundsLocation => {
                msg!("Error:  keyword={:?} Funds Not located in the appropriate pool for this instruction", if let Some(key) = keyword{key} else {""});
            }
            Self::TooEarly => {
                msg!("Error:  keyword={:?} Executing a process earlier than is allowed", if let Some(key) = keyword{key} else {""});
            }
            Self::TooLate => {
                msg!("Error:  keyword={:?} Executing a process later than is allowed", if let Some(key) = keyword{key} else {""});
            }
            Self::AlreadyVoted =>{ 
                msg!("Error: keyword={:?} Had already voted for this specific proposal", if let Some(key) = keyword{key} else {""});
            }
            Self::BeyondBounds => {
                msg!("Error: keyword={:} Value yielded beyond the specified boundaries", if let Some(key) = keyword{key} else {""});
            }
            Self::InvalidValPhrase => {
                msg!("Error: keyword={:} Validation Phrase Found in the sent account is different from that expected", if let Some(key) = keyword{key} else {""});
            }
        }
        ProgramError::from(self)
    }
}
