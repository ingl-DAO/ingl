pub mod state;
pub mod error;
pub mod instruction;
pub mod nfts;
pub mod processor;
pub mod utils;

use processor::process_instruction;
use solana_program::entrypoint;

entrypoint!(process_instruction);


#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2,2);
    }
}
