use crate::{
    error::InglError,
    instruction::InstructionEnum,
    state::constants::{GOVERNANCE_PROGRAM_SEED, INGL_REALM_NAME},
};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
};
use spl_governance::{
    instruction::{create_realm, deposit_governing_tokens, create_native_treasury, create_mint_governance, set_realm_authority},
    state::{enums::MintMaxVoteWeightSource, realm::{get_realm_address_seeds, SetRealmAuthorityAction}, governance::GovernanceConfig},
};
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    Ok(match InstructionEnum::decode(instruction_data) {
        InstructionEnum::InitInglDao {
            governance_config
        } => init_ingl_dao(
            program_id,
            accounts,
            governance_config
        )?,
        _ => Err(ProgramError::InvalidInstructionData)?,
    })
}

pub fn init_ingl_dao(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    governance_config: GovernanceConfig
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let realm_account_info = next_account_info(account_info_iter)?;
    let realm_config_account_info = next_account_info(account_info_iter)?;
    let realm_authority_account_info = next_account_info(account_info_iter)?;
    let payer_account_info = next_account_info(account_info_iter)?;
    let payer_council_token_associated_account_info = next_account_info(account_info_iter)?;
    let payer_council_token_record_account_info = next_account_info(account_info_iter)?;
    let community_token_mint_account_info = next_account_info(account_info_iter)?;
    let community_token_holding_account_info = next_account_info(account_info_iter)?;
    let community_token_governance_account_info = next_account_info(account_info_iter)?;
    let community_native_treasury_account_info = next_account_info(account_info_iter)?;
    let community_vote_addin_account_info = next_account_info(account_info_iter)?;
    let council_token_mint_account_info = next_account_info(account_info_iter)?;
    let council_token_holding_account_info = next_account_info(account_info_iter)?;
    let council_token_governance_account_info = next_account_info(account_info_iter)?;
    let initial_token_owner_record_account_info = next_account_info(account_info_iter)?;

    let spl_token_program_account_info = next_account_info(account_info_iter)?;
    let sysvar_rent_account_info = next_account_info(account_info_iter)?;
    let system_program_account_info = next_account_info(account_info_iter)?;

    // TODO: Still have to make all the neccessary checks

    let realm_pda_seed = &[GOVERNANCE_PROGRAM_SEED.as_ref(), INGL_REALM_NAME];
    
    invoke(
        &create_realm(
            program_id,
            &realm_authority_account_info.key,
            community_token_mint_account_info.key,
            payer_account_info.key,
            Some(council_token_mint_account_info.key.clone()),
            Some(community_vote_addin_account_info.key.clone()),
            Some(community_vote_addin_account_info.key.clone()),
            String::from(INGL_REALM_NAME),
            1,
            MintMaxVoteWeightSource::FULL_SUPPLY_FRACTION,
        ),
        &[
            realm_account_info.clone(),
            realm_authority_account_info.clone(),
            community_token_mint_account_info.clone(),
            community_token_holding_account_info.clone(),
            payer_account_info.clone(),
            system_program_account_info.clone(),
            spl_token_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
            council_token_mint_account_info.clone(),
            council_token_holding_account_info.clone(),
            community_vote_addin_account_info.clone(),
            community_vote_addin_account_info.clone(),
            realm_config_account_info.clone()
        ],
    )?;


     invoke(
        &deposit_governing_tokens(
            program_id,
            &realm_account_info.key,
            payer_council_token_associated_account_info.key,
            payer_account_info.key,
            payer_account_info.key,
            payer_account_info.key,
            1,
            council_token_mint_account_info.key
        ),
        &[
            realm_account_info.clone(),
            council_token_holding_account_info.clone(),
            payer_council_token_associated_account_info.clone(),
            payer_account_info.clone(),
            payer_account_info.clone(),
            payer_council_token_record_account_info.clone(),
            payer_account_info.clone(),
            system_program_account_info.clone(),
            spl_token_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
        ],
    )?;

    invoke(
        &create_mint_governance(
            program_id,
            &realm_account_info.key,
            community_token_mint_account_info.key,
            payer_account_info.key,
            initial_token_owner_record_account_info.key,
            payer_account_info.key,
            payer_account_info.key,
            None,
            governance_config.clone(),
            true
        ),
        &[
            realm_account_info.clone(),
            community_token_governance_account_info.clone(),
            community_token_mint_account_info.clone(),
            payer_account_info.clone(),
            initial_token_owner_record_account_info.clone(),
            payer_account_info.clone(),
            spl_token_program_account_info.clone(),
            system_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
            payer_account_info.clone(),
            realm_config_account_info.clone(),
        ],
    )?;

    invoke(
        &create_native_treasury(
            program_id,
            &community_token_mint_account_info.key,
            payer_account_info.key,
        ),
        &[
            community_token_governance_account_info.clone(),
            community_native_treasury_account_info.clone(),
            payer_account_info.clone(),
            system_program_account_info.clone(),
        ],
    )?;

    invoke(
        &create_mint_governance(
            program_id,
            &realm_account_info.key,
            council_token_mint_account_info.key,
            payer_account_info.key,
            initial_token_owner_record_account_info.key,
            payer_account_info.key,
            payer_account_info.key,
            None,
            governance_config.clone(),
            true
        ),
        &[
            realm_account_info.clone(),
            council_token_governance_account_info.clone(),
            council_token_mint_account_info.clone(),
            payer_account_info.clone(),
            initial_token_owner_record_account_info.clone(),
            payer_account_info.clone(),
            spl_token_program_account_info.clone(),
            system_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
            payer_account_info.clone(),
            realm_config_account_info.clone(),
        ],
    )?;

    invoke(
        &set_realm_authority(
            program_id,
            &realm_account_info.key,
            payer_account_info.key,
            Some(community_token_governance_account_info.key),
            SetRealmAuthorityAction::SetChecked
        ),
        &[
            realm_account_info.clone(),
            payer_account_info.clone(),
            community_token_governance_account_info.clone(),
        ],
    )?;
    Ok(())
}

// pub fn vote_validator_proposal(
//     program_id: &Pubkey,
//     accounts: &[AccountInfo],
// ) -> ProgramResult {

//     // vote validator proposals
//     Ok(())
// }

// pub fn create_validator_proposal(
//     program_id: &Pubkey,
//     accounts: &[AccountInfo],
// ) -> ProgramResult {

//     // create validator proposals
//     Ok(())
// }