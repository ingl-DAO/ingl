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
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Provided Struct Type does not match expected value.", keyword);}}
            Self::AddressMismatch => {msg!("Error:  Provided address do not match expected value");}
            Self::InvalidFundsLocation => {
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Funds Not located in the appropriate pool for this instruction", keyword);}
            }
            Self::TooEarly => {
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Executing a process earlier than is allowed", keyword);}
            }
            Self::TooLate => {
                if let Some(keyword) = keyword{msg!("Error:  keyword={:?} Executing a process later than is allowed", keyword);}
            }
            Self::AlreadyVoted =>{ 
                if let Some(keyword) = keyword{msg!("Error: keyword={:?} Had already voted for this specific proposal", keyword);}
            }
            Self::BeyondBounds => {
                if let Some(keyword) = keyword{msg!("Error: keyword={:} Value yielded beyond the specified boundaries", keyword);}
            }
            Self::InvalidValPhrase => {
                if let Some(keyword) = keyword{msg!("Error: keyword={:} Validation Phrase Found in the sent account is different from that expected", keyword);}
            }
        }
        ProgramError::from(self)
    }
}