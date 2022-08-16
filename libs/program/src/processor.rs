use crate::{
    error::InglError,
    instruction::{
        split, vote_create_account, vote_initialize_account, vote_withdraw, InstructionEnum,
    },
    nfts,
    state::{
        constants::*, Class, FundsLocation, GemAccountV0_0_1, GemAccountVersions, GlobalGems,
        InglVoteAccountData, ValidatorProposal, ValidatorVote, VoteInit, VoteRewards,
    },
    utils::{assert_is_signer, assert_owned_by, assert_program_owned, assert_pubkeys_exactitude},
};
use std::str::FromStr;

use anchor_lang::AnchorDeserialize;
use borsh::BorshSerialize;
use mpl_token_metadata::state::{Collection, Creator, DataV2, Metadata, PREFIX};
use num_traits::Pow;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    hash::hash,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    stake::{
        self,
        state::{Authorized, Lockup, StakeState},
    },
    system_instruction, system_program,
    sysvar::{self, Sysvar},
};
use solana_program::{native_token::LAMPORTS_PER_SOL, program_pack::Pack};
use spl_associated_token_account::{get_associated_token_address, *};
use spl_token::{error::TokenError, state::Account};
use switchboard_v2::{
    AggregatorHistoryBuffer, AggregatorHistoryRow, SWITCHBOARD_V2_DEVNET, SWITCHBOARD_V2_MAINNET,
};

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    Ok(match InstructionEnum::decode(instruction_data) {
        InstructionEnum::MintNewCollection => mint_collection(program_id, accounts)?, //1
        InstructionEnum::MintNft(class) => mint_nft(program_id, accounts, class)?,    //4
        InstructionEnum::InitRarityImprint => init_rarity_imprint(program_id, accounts)?,
        InstructionEnum::ImprintRarity => imprint_rarity(program_id, accounts)?, //
        InstructionEnum::AllocateNFT => allocate_sol(program_id, accounts)?,     //8
        InstructionEnum::DeAllocateNFT => deallocate_sol(program_id, accounts)?, //10
        InstructionEnum::CreateVoteAccount => create_vote_account(program_id, accounts)?, //7
        InstructionEnum::Redeem => redeem_nft(program_id, accounts)?,
        InstructionEnum::RegisterValidatorId => register_validator_id(program_id, accounts)?, //2
        InstructionEnum::CreateValidatorSelectionProposal => {
            create_validator_selection_proposal(program_id, accounts)?
        } //3
        InstructionEnum::VoteValidatorProposal {
            num_nfts,
            validator_index,
        } => vote_validator_proposal(program_id, accounts, num_nfts, validator_index)?, //5
        InstructionEnum::FinalizeProposal => finalize_proposal(program_id, accounts)?,        //6
        InstructionEnum::DelegateNFT => delegate_nft(program_id, accounts)?,                  //8
        InstructionEnum::UnDelegateNFT => undelegate_nft(program_id, accounts)?,              //9
        InstructionEnum::ProcessRewards => process_rewards(program_id, accounts)?,
        InstructionEnum::NFTWithdraw { cnt } => nft_withdraw(program_id, accounts, cnt as usize)?,
        InstructionEnum::CloseProposal => close_proposal(program_id, accounts)?,
        InstructionEnum::InitRebalance => init_rebalance(program_id, accounts)?,
        InstructionEnum::FinalizeRebalance => finalize_rebalance(program_id, accounts)?,
        _ => Err(ProgramError::InvalidInstructionData)?,
    })
}

pub fn finalize_proposal(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let _payer_account_info = next_account_info(account_info_iter)?;
    let proposal_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;

    assert_program_owned(proposal_account_info)?;
    let mut proposal_data = ValidatorProposal::decode(proposal_account_info)?;
    if let Some(_) = proposal_data.date_finalized {
        Err(ProgramError::InvalidAccountData)?
    }

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");
    assert_program_owned(global_gem_account_info)?;
    let mut global_gem_account_data = GlobalGems::decode(global_gem_account_info)?;

    if global_gem_account_data.pd_pool_total < MAXIMUM_DELEGATABLE_STAKE {
        Err(InglError::TooEarly.utilize(Some("pd_pool_total")))?
    }
    let (expected_proposal_id, _expected_proposal_bump) = Pubkey::find_program_address(
        &[
            PROPOSAL_KEY.as_ref(),
            &(global_gem_account_data.proposal_numeration - 1).to_be_bytes(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_proposal_id, proposal_account_info.key)?;
    proposal_data.date_finalized = Some(Clock::get()?.unix_timestamp as u32);

    let (winner_index, _) =
        proposal_data
            .votes
            .iter()
            .enumerate()
            .fold(
                (0, 0),
                |max, (ind, &val)| if val > max.1 { (ind, val) } else { max },
            );
    proposal_data.winner = Some(proposal_data.validator_ids[winner_index]);
    proposal_data.serialize(&mut &mut proposal_account_info.data.borrow_mut()[..])?;

    let index = global_gem_account_data
        .validator_list
        .iter()
        .position(|x| *x == proposal_data.winner.unwrap())
        .unwrap();
    global_gem_account_data.validator_list.remove(index);
    global_gem_account_data.is_proposal_ongoing = false;
    global_gem_account_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn vote_validator_proposal(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    num_nfts: u8,
    validator_index: u32,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let proposal_account_info = next_account_info(account_info_iter)?;

    assert_program_owned(proposal_account_info)?;
    let mut proposal_data = ValidatorProposal::decode(proposal_account_info)?;
    if let Some(_) = proposal_data.date_finalized {
        Err(InglError::TooLate.utilize(Some("Proposal Voted Already Ended")))?
    }
    for _ in 0..num_nfts {
        // 10 NFTs limit due to transaction size limit
        let mint_account_info = next_account_info(account_info_iter)?;
        let associated_token_account_info = next_account_info(account_info_iter)?;
        let gem_account_data_info = next_account_info(account_info_iter)?;

        let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
            &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
            program_id,
        );
        assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key)
            .expect("Error: @gem_account_info");

        assert_program_owned(gem_account_data_info)?;
        assert_owned_by(mint_account_info, &spl_program::id())?;
        assert_owned_by(associated_token_account_info, &spl_program::id())?;

        assert_pubkeys_exactitude(
            &get_associated_token_address(payer_account_info.key, mint_account_info.key),
            associated_token_account_info.key,
        )
        .expect("Error: @associated_token_address");
        let associated_token_address_data =
            Account::unpack(&associated_token_account_info.data.borrow())?;
        if associated_token_address_data.amount != 1 {
            Err(ProgramError::InsufficientFunds)?
        }

        let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(
            GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?,
        )?;

        if let Some(proposal_id) = gem_account_data.last_voted_proposal {
            if &proposal_id == proposal_account_info.key {
                Err(InglError::AlreadyVoted
                    .utilize(Some(mint_account_info.key.to_string().as_ref() as &str)))?
            }
        }

        gem_account_data.last_voted_proposal = Some(*proposal_account_info.key);
        gem_account_data.all_votes.push(ValidatorVote {
            validation_phrase: VALIDATOR_VOTE_VAL_PHRASE,
            proposal_id: *proposal_account_info.key,
            validator_index: validator_index,
        });
        proposal_data.votes[validator_index as usize] = proposal_data.votes
            [validator_index as usize]
            .checked_add((gem_account_data.class.get_class_lamports() / LAMPORTS_PER_SOL) as u32)
            .unwrap();
        gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;
    }

    proposal_data.serialize(&mut &mut proposal_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn create_validator_selection_proposal(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let proposal_account_info = next_account_info(account_info_iter)?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");
    assert_program_owned(global_gem_account_info)?;

    let mut global_gem_data = GlobalGems::decode(global_gem_account_info)?;

    if global_gem_data.is_proposal_ongoing {
        Err(InglError::TooEarly.utilize(Some("A Proposal Is Currently Ongoing")))?;
    }
    global_gem_data.is_proposal_ongoing = true;

    let (expected_proposal_id, expected_proposal_bump) = Pubkey::find_program_address(
        &[
            PROPOSAL_KEY.as_ref(),
            &global_gem_data.proposal_numeration.to_be_bytes(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_proposal_id, proposal_account_info.key)?;

    let space = 10240;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    if global_gem_data.validator_list.len() == 0 {
        Err(InglError::TooEarly.utilize(Some(
            "Validator list can't be empty. Wait for validator registrations",
        )))?
    }

    invoke_signed(
        &system_instruction::create_account(
            payer_account_info.key,
            &expected_proposal_id,
            rent_lamports,
            space as u64,
            program_id,
        ),
        &[payer_account_info.clone(), proposal_account_info.clone()],
        &[&[
            PROPOSAL_KEY.as_ref(),
            &global_gem_data.proposal_numeration.to_be_bytes(),
            &[expected_proposal_bump],
        ]],
    )?;

    let proposal_data = ValidatorProposal {
        validation_phrase: VALIDATOR_PROPOSAL_VAL_PHRASE,
        validator_ids: global_gem_data.clone().validator_list, // Vec([id1, id2, id3, id4, id5])
        date_created: Clock::get()?.unix_timestamp as u32,
        date_finalized: None,
        votes: [0, global_gem_data.clone().validator_list.len() as u32].to_vec(), //Vec([2, 3, 5, 2, 1]) The total Sol backing the NFTs used to vote.
        winner: None,
    };

    proposal_data.serialize(&mut &mut proposal_account_info.data.borrow_mut()[..])?;

    global_gem_data.proposal_numeration += 1;

    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn register_validator_id(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let mint_authority_account_info = next_account_info(account_info_iter)?;
    let validator_info = next_account_info(account_info_iter)?; //Remove this and change it back to payer only after hackathon.
    let dup_prevention_account = next_account_info(account_info_iter)?;

    let (expected_dup_key, expected_dup_bump) = Pubkey::find_program_address(&[DUPKEYBYTES, validator_info.key.as_ref()], program_id);
    assert_pubkeys_exactitude(&expected_dup_key, dup_prevention_account.key)?;

    invoke_signed(
        &system_instruction::create_account(payer_account_info.key, &expected_dup_key, Rent::get()?.minimum_balance(1), 1,program_id),
        &[payer_account_info.clone(), dup_prevention_account.clone()],
        &[&[DUPKEYBYTES, validator_info.key.as_ref(), &[expected_dup_bump]]]
    )?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    let (mint_authority_key, _mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&mint_authority_key, mint_authority_account_info.key)
        .expect("Error: @mint_authority_account_info");

    invoke(
        &system_instruction::transfer(
            payer_account_info.key,
            mint_authority_account_info.key,
            2 * LAMPORTS_PER_SOL,
        ),
        &[
            payer_account_info.clone(),
            mint_authority_account_info.clone(),
        ],
    )?;

    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");
    assert_program_owned(global_gem_account_info)?;
    assert_is_signer(payer_account_info)?;

    let mut global_gem_data = GlobalGems::decode(global_gem_account_info)?;

    if let Some(_) = global_gem_data
        .validator_list
        .iter()
        .position(|x| x == validator_info.key)
    {
        Err(InglError::TooLate.utilize(Some("Already Created")))?
    }

    global_gem_data.validator_list.push(*validator_info.key);
    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn create_vote_account(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let validator_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let sysvar_rent_info = next_account_info(account_info_iter)?;
    let sysvar_clock_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let proposal_account_info = next_account_info(account_info_iter)?;
    let mint_associated_token_account = next_account_info(account_info_iter)?;
    let council_mint_account_info = next_account_info(account_info_iter)?;
    let council_mint_authority_info = next_account_info(account_info_iter)?;
    let system_program_account_info = next_account_info(account_info_iter)?;
    let spl_token_program_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let stake_account_info = next_account_info(account_info_iter)?;
    let pd_pool_account_info = next_account_info(account_info_iter)?;
    let sysvar_stake_history_info = next_account_info(account_info_iter)?;
    let sysvar_stake_config_info = next_account_info(account_info_iter)?;

    assert_program_owned(global_gem_account_info)?;
    assert_program_owned(proposal_account_info)?;
    assert_pubkeys_exactitude(sysvar_clock_info.key, &sysvar::clock::id())?;
    assert_pubkeys_exactitude(sysvar_stake_history_info.key, &sysvar::stake_history::id())?;
    assert_pubkeys_exactitude(
        sysvar_stake_config_info.key,
        &solana_program::stake::config::id(),
    )?;

    let (pd_pool_pubkey, _pd_pool_bump) =
        Pubkey::find_program_address(&[PD_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&pd_pool_pubkey, pd_pool_account_info.key)
        .expect("Error: @pd_pool_account_info");

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    let global_gem_data = GlobalGems::decode(global_gem_account_info)?;

    let (expected_vote_data_pubkey, expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");

    let (expected_proposal_id, _expected_proposal_bump) = Pubkey::find_program_address(
        &[
            PROPOSAL_KEY.as_ref(),
            &(global_gem_data.proposal_numeration - 1).to_be_bytes(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_proposal_id, proposal_account_info.key)?;

    let proposal_data = ValidatorProposal::decode(proposal_account_info)?;

    assert_pubkeys_exactitude(validator_info.key, &proposal_data.winner.unwrap())
        .expect("validator id, not that expected");

    let (expected_vote_pubkey, expected_vote_pubkey_bump) = Pubkey::find_program_address(
        &[
            VOTE_ACCOUNT_KEY.as_ref(),
            &(global_gem_data.proposal_numeration - 1).to_be_bytes(),
        ],
        program_id,
    );
    let (authorized_withdrawer, _authorized_withdrawer_nonce) =
        Pubkey::find_program_address(&[AUTHORIZED_WITHDRAWER_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(vote_account_info.key, &expected_vote_pubkey)
        .expect("vote account pubkey is dissimilar to the expected vote pubkey");

    let (expected_mint_key, _expected_mint_bump) =
        Pubkey::find_program_address(&[COUNCIL_MINT_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(council_mint_account_info.key, &expected_mint_key)
        .expect("Council mint sent, not that expected");

    let (expected_council_mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[COUNCIL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(
        council_mint_authority_info.key,
        &expected_council_mint_authority_key,
    )
    .expect("Council mint authority is not that expected");

    let expected_assoc_key =
        get_associated_token_address(vote_account_info.key, council_mint_account_info.key);
    assert_pubkeys_exactitude(&expected_assoc_key, mint_associated_token_account.key)
        .expect("Council associated token is not that expected");

    let (expected_stake_key, expected_stake_bump) = Pubkey::find_program_address(
        &[STAKE_ACCOUNT_KEY.as_ref(), expected_vote_pubkey.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_stake_key, stake_account_info.key)
        .expect("stake account info");

    let space = 10240; //Change this size to 100_000+ through reallocs

    let lamports = Rent::get()?.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            validator_info.key,
            &expected_vote_data_pubkey,
            lamports,
            space as u64,
            program_id,
        ),
        &[validator_info.clone(), ingl_vote_data_account_info.clone()],
        &[&[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
            &[expected_vote_data_bump],
        ]],
    )?;
    let ingl_vote_data = InglVoteAccountData {
        validation_phrase: INGL_VOTE_ACCOUNT_DATA_VAL_PHRASE,
        total_delegated: 0,
        last_withdraw_epoch: Clock::get()?.epoch,
        dealloced: 0,
        pending_validator_rewards: None,
        validator_id: *validator_info.key,
        pending_delegation_total: 0,
        is_t_stake_initialized: false,
        vote_rewards: Vec::new(),
        last_total_staked: 0,
    };

    ingl_vote_data.serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;

    invoke(
        &spl_associated_token_account::instruction::create_associated_token_account(
            validator_info.key,
            vote_account_info.key,
            council_mint_account_info.key,
        ),
        &[
            validator_info.clone(),
            mint_associated_token_account.clone(),
            vote_account_info.clone(),
            council_mint_account_info.clone(),
            system_program_account_info.clone(),
            spl_token_program_account_info.clone(),
        ],
    )?;

    invoke_signed(
        &spl_token::instruction::mint_to(
            &spl_token::id(),
            council_mint_account_info.key,
            mint_associated_token_account.key,
            council_mint_authority_info.key,
            &[],
            1,
        )?,
        &[
            council_mint_account_info.clone(),
            mint_associated_token_account.clone(),
            council_mint_authority_info.clone(),
        ],
        &[&[COUNCIL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let vote_init = VoteInit {
        node_pubkey: *validator_info.key,
        authorized_voter: *validator_info.key,
        commission: 10,
        authorized_withdrawer,
    };
    invoke_signed(
        &vote_create_account(validator_info.key, vote_account_info.key),
        &[validator_info.clone(), vote_account_info.clone()],
        &[&[
            VOTE_ACCOUNT_KEY.as_ref(),
            &(global_gem_data.proposal_numeration - 1).to_be_bytes(),
            &[expected_vote_pubkey_bump],
        ]],
    )?;
    invoke(
        &vote_initialize_account(vote_account_info.key, &vote_init),
        &[
            vote_account_info.clone(),
            sysvar_rent_info.clone(),
            sysvar_clock_info.clone(),
            validator_info.clone(),
        ],
    )?;

    let authorized = &Authorized {
        staker: *pd_pool_account_info.key,
        withdrawer: *pd_pool_account_info.key,
    };
    let lockup = &Lockup {
        unix_timestamp: 0,
        epoch: 0,
        custodian: *pd_pool_account_info.key,
    };

    let lamports = 1 * LAMPORTS_PER_SOL
        + Rent::get()?.minimum_balance(std::mem::size_of::<StakeState>() as usize);
    msg!("creating account");
    invoke_signed(
        &system_instruction::create_account(
            validator_info.key,
            stake_account_info.key,
            lamports,
            std::mem::size_of::<StakeState>() as u64,
            &stake::program::id(),
        ),
        &[validator_info.clone(), stake_account_info.clone()],
        &[&[
            STAKE_ACCOUNT_KEY.as_ref(),
            expected_vote_pubkey.as_ref(),
            &[expected_stake_bump],
        ]],
    )?;
    msg!("Initializing stake");
    invoke(
        &solana_program::stake::instruction::initialize(stake_account_info.key, authorized, lockup),
        &[stake_account_info.clone(), sysvar_rent_info.clone()],
    )?;

    Ok(())
}

pub fn allocate_sol(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let gem_account_data_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let pd_pool_account_info = next_account_info(account_info_iter)?;
    let minting_pool_account_info = next_account_info(account_info_iter)?;

    assert_program_owned(gem_account_data_info)?;
    assert_program_owned(global_gem_account_info)?;
    assert_owned_by(mint_account_info, &spl_program::id())?;
    assert_owned_by(associated_token_account_info, &spl_program::id())?;

    assert_is_signer(payer_account_info).unwrap();

    let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key)
        .expect("Error: @gem_account_info");

    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("Error: @associated_token_address");
    let associated_token_address_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_address_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    let (pd_pool_pubkey, _pd_pool_bump) =
        Pubkey::find_program_address(&[PD_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&pd_pool_pubkey, pd_pool_account_info.key)
        .expect("Error: @pd_pool_account_info");
    let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(
        GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?,
    )?;
    let mut global_gem_account_data = GlobalGems::decode(global_gem_account_info)?;

    let (minting_pool_id, minting_pool_bump) =
        Pubkey::find_program_address(&[INGL_MINTING_POOL_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&minting_pool_id, minting_pool_account_info.key)
        .expect("Error: @minting_pool_account_info");

    match gem_account_data.funds_location {
        FundsLocation::MintingPool => {
            gem_account_data.funds_location = FundsLocation::PDPool;
        }
        _ => Err(InglError::InvalidFundsLocation.utilize(Some("gem's funds location.")))?,
    }

    let mint_cost = gem_account_data.class.clone().get_class_lamports();
    //tranfer token from mint_pool, to pd_pool
    invoke_signed(
        &system_instruction::transfer(&minting_pool_id, &pd_pool_pubkey, mint_cost),
        &[
            minting_pool_account_info.clone(),
            pd_pool_account_info.clone(),
        ],
        &[&[INGL_MINTING_POOL_KEY.as_ref(), &[minting_pool_bump]]],
    )?;

    let clock = Clock::get()?;

    gem_account_data.date_allocated = Some(clock.unix_timestamp as u32);
    gem_account_data.redeemable_date = clock.unix_timestamp as u32 + /*86400**/1*365*2; //Needs to be changed back to 86400 before deployment on mainnet. reduced for testing purposes during development

    global_gem_account_data.pd_pool_total += mint_cost;

    gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;
    global_gem_account_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn deallocate_sol(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let gem_account_data_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let pd_pool_account_info = next_account_info(account_info_iter)?;
    let minting_pool_account_info = next_account_info(account_info_iter)?;

    assert_program_owned(gem_account_data_info)?;
    assert_program_owned(global_gem_account_info)?;

    assert_owned_by(mint_account_info, &spl_program::id())?;
    assert_owned_by(associated_token_account_info, &spl_program::id())?;

    assert_is_signer(payer_account_info).unwrap();

    let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key)
        .expect("Error: @gem_account_info");

    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("Error: @associated_token_address");
    let associated_token_address_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_address_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    let (pd_pool_pubkey, pd_pool_bump) =
        Pubkey::find_program_address(&[PD_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&pd_pool_pubkey, pd_pool_account_info.key)
        .expect("Error: @pd_pool_account_info");

    let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(
        GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?,
    )?;
    let mut global_gem_account_data = GlobalGems::decode(global_gem_account_info)?;

    let (minting_pool_id, _minting_pool_bump) =
        Pubkey::find_program_address(&[INGL_MINTING_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&minting_pool_id, minting_pool_account_info.key)
        .expect("Error: @minting_pool_account_info");

    match gem_account_data.funds_location {
        FundsLocation::PDPool => {
            gem_account_data.funds_location = FundsLocation::MintingPool;
        }
        _ => Err(InglError::InvalidFundsLocation.utilize(Some("gem's funds location.")))?,
    }

    let mint_cost = gem_account_data.class.clone().get_class_lamports();
    //tranfer token from mint_pool, to pd_pool
    invoke_signed(
        &system_instruction::transfer(&pd_pool_pubkey, &minting_pool_id, mint_cost),
        &[
            pd_pool_account_info.clone(),
            minting_pool_account_info.clone(),
        ],
        &[&[PD_POOL_KEY.as_ref(), &[pd_pool_bump]]],
    )?;

    let clock = Clock::get()?;

    if (clock.unix_timestamp as u32) < gem_account_data.redeemable_date {
        Err(InglError::TooEarly.utilize(Some("Deallocating Earlier than allowed")))?;
    }
    global_gem_account_data.pd_pool_total -= mint_cost;

    gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;
    global_gem_account_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn mint_nft(program_id: &Pubkey, accounts: &[AccountInfo], class: Class) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let mint_authority_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let spl_token_program_account_info = next_account_info(account_info_iter)?;
    let sysvar_rent_account_info = next_account_info(account_info_iter)?;
    let system_program_account_info = next_account_info(account_info_iter)?;
    let metadata_account_info = next_account_info(account_info_iter)?;
    let minting_pool_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let gem_account_info = next_account_info(account_info_iter)?;
    let ingl_edition_account_info = next_account_info(account_info_iter)?;
    let nft_edition_account_info = next_account_info(account_info_iter)?;
    let ingl_collection_mint_info = next_account_info(account_info_iter)?;
    let ingl_collection_account_info = next_account_info(account_info_iter)?;

    // msg!("global gem");
    assert_program_owned(global_gem_account_info)?;
    // msg!("collection edition");
    assert_owned_by(ingl_edition_account_info, &metaplex::id())?;
    // msg!("ingl collection edition");
    assert_owned_by(ingl_collection_account_info, &metaplex::id())?;
    // msg!("ingl collection edition");
    assert_owned_by(ingl_collection_mint_info, &spl_program::id())?;
    // msg!("ingl collection mint edition");

    let clock = Clock::get()?;
    // Getting timestamp
    let current_timestamp = clock.unix_timestamp as u32;

    let (gem_account_pubkey, gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_info.key)
        .expect("Error: @gem_account_info");
    let space = 500;
    let rent_lamports = Rent::get()?.minimum_balance(space);
    // msg!("Reached invoke");
    invoke_signed(
        &system_instruction::create_account(
            payer_account_info.key,
            &gem_account_pubkey,
            rent_lamports,
            space as u64,
            program_id,
        ),
        &[payer_account_info.clone(), gem_account_info.clone()],
        &[&[
            GEM_ACCOUNT_CONST.as_ref(),
            mint_account_info.key.as_ref(),
            &[gem_account_bump],
        ]],
    )?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");
    let mut global_gem_data = GlobalGems::decode(global_gem_account_info)?;

    let space = 82;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    let (minting_pool_id, _minting_pool_bump) =
        Pubkey::find_program_address(&[INGL_MINTING_POOL_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&minting_pool_id, minting_pool_account_info.key)
        .expect("Error: @minting_pool_account_info");

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&mint_authority_key, mint_authority_account_info.key)
        .expect("Error: @mint_authority_account_info");

    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("Error: @associated_token_account_info");

    assert_pubkeys_exactitude(&system_program::id(), system_program_account_info.key)
        .expect("Error: @system_program_account_info");

    assert_pubkeys_exactitude(&spl_token::id(), spl_token_program_account_info.key)
        .expect("Error: @spl_token_program_account_info");

    let mpl_token_metadata_id = mpl_token_metadata::id();
    let metadata_seeds = &[
        PREFIX.as_bytes(),
        mpl_token_metadata_id.as_ref(),
        mint_account_info.key.as_ref(),
    ];

    let (nft_metadata_key, _nft_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata::id());

    assert_pubkeys_exactitude(&nft_metadata_key, metadata_account_info.key)
        .expect("Error: @meta_data_account_info");

    let mint_cost = class.clone().get_class_lamports();
    global_gem_data.counter += 1;
    global_gem_data.total_raised += mint_cost;

    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;
    //tranfer token from one account to an other
    invoke(
        &system_instruction::transfer(payer_account_info.key, &minting_pool_id, mint_cost),
        &[
            payer_account_info.clone(),
            minting_pool_account_info.clone(),
        ],
    )?;

    //create the mint account
    invoke(
        &system_instruction::create_account(
            payer_account_info.key,
            mint_account_info.key,
            rent_lamports,
            space as u64,
            spl_token_program_account_info.key,
        ),
        &[payer_account_info.clone(), mint_account_info.clone()],
    )?;

    invoke(
        &spl_token::instruction::initialize_mint(
            &spl_token::id(),
            &mint_account_info.key,
            &mint_authority_key,
            Some(&mint_authority_key),
            0,
        )?,
        &[mint_account_info.clone(), sysvar_rent_account_info.clone()],
    )?;

    invoke(
        &spl_associated_token_account::instruction::create_associated_token_account(
            payer_account_info.key,
            payer_account_info.key,
            mint_account_info.key,
        ),
        &[
            payer_account_info.clone(),
            associated_token_account_info.clone(),
            payer_account_info.clone(),
            mint_account_info.clone(),
            system_program_account_info.clone(),
            spl_token_program_account_info.clone(),
        ],
    )?;

    // msg!("Mint new collection token");
    invoke_signed(
        &spl_token::instruction::mint_to(
            spl_token_program_account_info.key,
            mint_account_info.key,
            associated_token_account_info.key,
            &mint_authority_key,
            &[],
            1,
        )?,
        &[
            mint_account_info.clone(),
            associated_token_account_info.clone(),
            mint_authority_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let mut creators = Vec::new();
    creators.push(Creator {
        address: mint_authority_key,
        verified: true,
        share: 100,
    });

    let (ingl_nft_collection_key, _ingl_nft_bump) =
        Pubkey::find_program_address(&[INGL_NFT_COLLECTION_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&ingl_nft_collection_key, ingl_collection_mint_info.key)
        .expect("Error: @ingl_collection_account_info");

    let metadata_seeds = &[
        PREFIX.as_ref(),
        mpl_token_metadata_id.as_ref(),
        ingl_nft_collection_key.as_ref(),
    ];

    let (collection_metadata_key, _collection_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata_id);

    assert_pubkeys_exactitude(&collection_metadata_key, ingl_collection_account_info.key)
        .expect("Error: @collection_metadata_info");

    // msg!("starting metadata creation");
    invoke_signed(
        &mpl_token_metadata::instruction::create_metadata_accounts_v3(
            mpl_token_metadata_id,
            nft_metadata_key,
            *mint_account_info.key,
            *mint_authority_account_info.key,
            *payer_account_info.key,
            *mint_authority_account_info.key,
            String::from("Ingl Gem #") + &global_gem_data.counter.to_string(),
            String::from("I-Gem#") + &global_gem_data.counter.to_string(),
            String::from(nfts::get_uri(class, None)),
            Some(creators),
            300,
            true,
            true,
            Some(Collection {
                verified: false,
                key: ingl_nft_collection_key,
            }),
            None,
            None,
        ),
        &[
            metadata_account_info.clone(),
            mint_account_info.clone(),
            mint_authority_account_info.clone(),
            payer_account_info.clone(),
            mint_authority_account_info.clone(),
            system_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let (ingl_collection_edition_key, _collection_edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            ingl_nft_collection_key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&ingl_collection_edition_key, ingl_edition_account_info.key)
        .expect("Error: @edition_account_info");

    // msg!("verifying collection");
    invoke_signed(
        &mpl_token_metadata::instruction::verify_collection(
            mpl_token_metadata_id,
            nft_metadata_key,
            mint_authority_key,
            *payer_account_info.key,
            ingl_nft_collection_key,
            collection_metadata_key,
            ingl_collection_edition_key,
            None,
        ),
        &[
            metadata_account_info.clone(),
            mint_authority_account_info.clone(),
            payer_account_info.clone(),
            ingl_collection_mint_info.clone(),
            ingl_collection_account_info.clone(),
            ingl_edition_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let (nft_edition_key, _edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            mint_account_info.key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&nft_edition_key, nft_edition_account_info.key)
        .expect("Error: @edition_account_info");

    // msg!("Creating master Edition account...");
    invoke_signed(
        &mpl_token_metadata::instruction::create_master_edition_v3(
            mpl_token_metadata_id,
            nft_edition_key,
            *mint_account_info.key,
            mint_authority_key,
            mint_authority_key,
            nft_metadata_key,
            *payer_account_info.key,
            None,
        ),
        &[
            nft_edition_account_info.clone(),
            mint_account_info.clone(),
            mint_authority_account_info.clone(),
            mint_authority_account_info.clone(),
            payer_account_info.clone(),
            metadata_account_info.clone(),
            spl_token_program_account_info.clone(),
            system_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    invoke(
        &spl_token::instruction::approve(
            &spl_token::id(),
            associated_token_account_info.key,
            &mint_authority_key,
            payer_account_info.key,
            &[],
            1,
        )?,
        &[
            associated_token_account_info.clone(),
            mint_authority_account_info.clone(),
            payer_account_info.clone(),
        ],
    )?;

    let (edition_key, _edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            ingl_nft_collection_key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&edition_key, ingl_edition_account_info.key)
        .expect("Error: @edition_account_info");

    // msg!("updating update_primary_sale_happened_via_token");
    invoke(
        &mpl_token_metadata::instruction::update_primary_sale_happened_via_token(
            mpl_token_metadata::id(),
            nft_metadata_key,
            *payer_account_info.key,
            *associated_token_account_info.key,
        ),
        &[
            metadata_account_info.clone(),
            payer_account_info.clone(),
            associated_token_account_info.clone(),
        ],
    )?;

    let gem_account_data = GemAccountV0_0_1 {
        struct_id: GemAccountVersions::GemAccountV0_0_1,
        validation_phrase: GEM_ACCOUNT_VAL_PHRASE,
        date_created: current_timestamp,
        redeemable_date: current_timestamp,
        numeration: global_gem_data.counter,
        rarity: None,
        funds_location: FundsLocation::MintingPool,
        rarity_seed_time: None,
        date_allocated: None,
        class: class,
        last_voted_proposal: None,
        last_withdrawal_epoch: None,
        last_delegation_epoch: None,
        all_withdraws: Vec::new(),
        all_votes: Vec::new(),
    };
    gem_account_data.serialize(&mut &mut gem_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn mint_collection(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let collection_holder_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let mint_authority_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let spl_token_program_account_info = next_account_info(account_info_iter)?;
    let sysvar_rent_account_info = next_account_info(account_info_iter)?;
    let system_program_account_info = next_account_info(account_info_iter)?;
    let metadata_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let edition_account_info = next_account_info(account_info_iter)?;
    let council_mint_account_info = next_account_info(account_info_iter)?;
    let council_mint_authority_info = next_account_info(account_info_iter)?;

    let (global_gem_pubkey, global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    let (expected_mint_key, expected_mint_bump) =
        Pubkey::find_program_address(&[COUNCIL_MINT_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(council_mint_account_info.key, &expected_mint_key)
        .expect("Council mint sent, not that expected");

    let (expected_council_mint_authority_key, _mint_authority_bump) =
        Pubkey::find_program_address(&[COUNCIL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(
        council_mint_authority_info.key,
        &expected_council_mint_authority_key,
    )
    .expect("Council mint authority is not that expected");
    let space = 82;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    // msg!("Create mint account");
    invoke_signed(
        &system_instruction::create_account(
            payer_account_info.key,
            council_mint_account_info.key,
            rent_lamports,
            space as u64,
            spl_token_program_account_info.key,
        ),
        &[
            payer_account_info.clone(),
            council_mint_account_info.clone(),
        ],
        &[&[COUNCIL_MINT_KEY.as_ref(), &[expected_mint_bump]]],
    )?;

    invoke(
        &spl_token::instruction::initialize_mint(
            &spl_token::id(),
            council_mint_account_info.key,
            &expected_council_mint_authority_key,
            Some(&expected_council_mint_authority_key),
            0,
        )?,
        &[
            council_mint_account_info.clone(),
            sysvar_rent_account_info.clone(),
        ],
    )?;

    let space = 10000;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    // msg!("Create global_gem account");
    invoke_signed(
        &system_instruction::create_account(
            payer_account_info.key,
            global_gem_account_info.key,
            rent_lamports,
            space as u64,
            program_id,
        ),
        &[payer_account_info.clone(), global_gem_account_info.clone()],
        &[&[GLOBAL_GEM_KEY.as_ref(), &[global_gem_bump]]],
    )?;

    let global_gem_data = GlobalGems {
        validation_phrase: GLOBAL_GEMS_VAL_PHRASE,
        counter: 0,
        total_raised: 0,
        pd_pool_total: 0,
        delegated_total: 0,
        is_proposal_ongoing: false,
        proposal_numeration: 0,
        pending_delegation_total: 0,
        validator_list: Vec::new(),
        dealloced_total: 0,
    };
    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    let (ingl_nft_collection_key, ingl_nft_bump) =
        Pubkey::find_program_address(&[INGL_NFT_COLLECTION_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&ingl_nft_collection_key, mint_account_info.key)
        .expect("Error: @Mint_account_info");

    let space = 82;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    // msg!("Create mint account");
    invoke_signed(
        &system_instruction::create_account(
            payer_account_info.key,
            mint_account_info.key,
            rent_lamports,
            space as u64,
            spl_token_program_account_info.key,
        ),
        &[payer_account_info.clone(), mint_account_info.clone()],
        &[&[INGL_NFT_COLLECTION_KEY.as_ref(), &[ingl_nft_bump]]],
    )?;

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&mint_authority_key, mint_authority_account_info.key)
        .expect("Error: @mint_authority_account_info");

    // msg!("Initialize mint account");
    invoke(
        &spl_token::instruction::initialize_mint(
            &spl_token::id(),
            &mint_account_info.key,
            &mint_authority_key,
            Some(&mint_authority_key),
            0,
        )?,
        &[mint_account_info.clone(), sysvar_rent_account_info.clone()],
    )?;

    let (collection_holder_key, _chk_bump) =
        Pubkey::find_program_address(&[COLLECTION_HOLDER_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&collection_holder_key, collection_holder_info.key)
        .expect("Error: @collection_holder_info");

    let collection_associated_pubkey = spl_associated_token_account::get_associated_token_address(
        &collection_holder_key,
        mint_account_info.key,
    );
    assert_pubkeys_exactitude(
        &collection_associated_pubkey,
        associated_token_account_info.key,
    )
    .expect("Error: @Associated_token_account");

    // msg!("Create associated token account");
    invoke(
        &spl_associated_token_account::instruction::create_associated_token_account(
            payer_account_info.key,
            collection_holder_info.key,
            mint_account_info.key,
        ),
        &[
            payer_account_info.clone(),
            associated_token_account_info.clone(),
            collection_holder_info.clone(),
            mint_account_info.clone(),
            system_program_account_info.clone(),
            spl_token_program_account_info.clone(),
        ],
    )?;

    // msg!("Mint new collection token");
    invoke_signed(
        &spl_token::instruction::mint_to(
            spl_token_program_account_info.key,
            mint_account_info.key,
            associated_token_account_info.key,
            &mint_authority_key,
            &[],
            1,
        )?,
        &[
            mint_account_info.clone(),
            associated_token_account_info.clone(),
            mint_authority_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let mut creators = Vec::new();
    creators.push(Creator {
        address: mint_authority_key,
        verified: true,
        share: 100,
    });

    let mpl_token_metadata_id = mpl_token_metadata::id();
    let metadata_seeds = &[
        PREFIX.as_ref(),
        mpl_token_metadata_id.as_ref(),
        mint_account_info.key.as_ref(),
    ];

    let (nft_metadata_key, _nft_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata_id);

    assert_pubkeys_exactitude(&nft_metadata_key, metadata_account_info.key)
        .expect("Error: @nft_meta_data_account_info");

    // msg!("Create metaplex nft account v3");
    invoke_signed(
        &mpl_token_metadata::instruction::create_metadata_accounts_v3(
            mpl_token_metadata_id,
            nft_metadata_key,
            *mint_account_info.key,
            *mint_authority_account_info.key,
            *payer_account_info.key,
            *mint_authority_account_info.key,
            String::from("Ingl-GemStone"),
            String::from("I-GEM"),
            String::from("https://arweave.net/V-GN01-V0OznWUpKEIf0XAMEA_-ndFOfYKNJoPdNpsE"),
            Some(creators),
            300,
            true,
            true,
            None,
            None,
            None,
        ),
        &[
            metadata_account_info.clone(),
            mint_account_info.clone(),
            mint_authority_account_info.clone(),
            payer_account_info.clone(),
            mint_authority_account_info.clone(),
            system_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let (edition_key, _edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            mint_account_info.key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&edition_key, edition_account_info.key)
        .expect("Error: @edition_account_info");

    // msg!("Creating master Edition account...");
    invoke_signed(
        &mpl_token_metadata::instruction::create_master_edition_v3(
            mpl_token_metadata_id,
            edition_key,
            *mint_account_info.key,
            mint_authority_key,
            mint_authority_key,
            nft_metadata_key,
            *payer_account_info.key,
            Some(0),
        ),
        &[
            edition_account_info.clone(),
            mint_account_info.clone(),
            mint_authority_account_info.clone(),
            mint_authority_account_info.clone(),
            payer_account_info.clone(),
            metadata_account_info.clone(),
            spl_token_program_account_info.clone(),
            system_program_account_info.clone(),
            sysvar_rent_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;
    Ok(())
}
pub fn init_rarity_imprint(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let gem_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let freeze_authority_account_info = next_account_info(account_info_iter)?;
    let nft_edition_account_info = next_account_info(account_info_iter)?;

    let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );

    assert_is_signer(payer_account_info).unwrap();

    let associated_token_account_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_account_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    assert_program_owned(gem_account_info)?;
    assert_owned_by(mint_account_info, &spl_program::id())?;
    assert_owned_by(associated_token_account_info, &spl_program::id())?;

    assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_info.key).expect("gem_account_info");
    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("associated_token_account_info");

    let mut gem_data = GemAccountV0_0_1::validate(GemAccountVersions::decode_unchecked(
        &gem_account_info.data.borrow(),
    )?)?;

    if let Some(_) = gem_data.rarity_seed_time {
        Err(ProgramError::InvalidAccountData)?
    }

    if associated_token_account_data.is_frozen() {
        Err(TokenError::AccountFrozen)?
    }

    gem_data.rarity_seed_time =
        Some(Clock::get()?.unix_timestamp as u32 + PRICE_TIME_INTERVAL as u32);
    gem_data.serialize(&mut &mut gem_account_info.data.borrow_mut()[..])?;

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&mint_authority_key, freeze_authority_account_info.key)
        .expect("freeze_authority_account_info");

    let mpl_token_metadata_id = mpl_token_metadata::id();
    let (nft_edition_key, _nft_edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            mint_account_info.key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&nft_edition_key, nft_edition_account_info.key)
        .expect("Error: @edition_account_info");

    invoke_signed(
        &mpl_token_metadata::instruction::freeze_delegated_account(
            mpl_token_metadata_id,
            mint_authority_key,
            *associated_token_account_info.key,
            nft_edition_key,
            *mint_account_info.key,
        ),
        &[
            freeze_authority_account_info.clone(),
            associated_token_account_info.clone(),
            nft_edition_account_info.clone(),
            mint_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    Ok(())
}

pub fn imprint_rarity(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let gem_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let freeze_authority_account_info = next_account_info(account_info_iter)?;
    let metadata_account_info = next_account_info(account_info_iter)?;
    let nft_edition_account_info = next_account_info(account_info_iter)?;

    let btc_feed_account_info = next_account_info(account_info_iter)?;
    let sol_feed_account_info = next_account_info(account_info_iter)?;
    let eth_feed_account_info = next_account_info(account_info_iter)?;
    let bnb_feed_account_info = next_account_info(account_info_iter)?;

    assert_program_owned(gem_account_info)?;
    assert_owned_by(mint_account_info, &spl_program::id())?;
    assert_owned_by(associated_token_account_info, &spl_program::id())?;
    assert_owned_by(btc_feed_account_info, &SWITCHBOARD_V2_DEVNET).or(assert_owned_by(
        btc_feed_account_info,
        &SWITCHBOARD_V2_MAINNET,
    ))?;
    assert_owned_by(sol_feed_account_info, &SWITCHBOARD_V2_DEVNET).or(assert_owned_by(
        sol_feed_account_info,
        &SWITCHBOARD_V2_MAINNET,
    ))?;
    assert_owned_by(eth_feed_account_info, &SWITCHBOARD_V2_DEVNET).or(assert_owned_by(
        eth_feed_account_info,
        &SWITCHBOARD_V2_MAINNET,
    ))?;
    assert_owned_by(bnb_feed_account_info, &SWITCHBOARD_V2_DEVNET).or(assert_owned_by(
        bnb_feed_account_info,
        &SWITCHBOARD_V2_MAINNET,
    ))?;

    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("associated_token_account_info");
    assert_is_signer(payer_account_info).unwrap();

    let associated_token_account_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_account_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }
    if !associated_token_account_data.is_frozen() {
        Err(TokenError::AccountFrozen)?
    }

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&mint_authority_key, freeze_authority_account_info.key)
        .expect("freeze_authority_account_info");

    let (gem_pubkey, _gem_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_pubkey, gem_account_info.key).expect("gem_account_info");

    assert_pubkeys_exactitude(
        &Pubkey::from_str(BTC_FEED_PUBLIC_KEY).unwrap(),
        btc_feed_account_info.key,
    )
    .expect("btc_history_account_info_owner");
    assert_pubkeys_exactitude(
        &Pubkey::from_str(SOL_FEED_PUBLIC_KEY).unwrap(),
        sol_feed_account_info.key,
    )
    .expect("sol_price_account_info_owner");
    assert_pubkeys_exactitude(
        &Pubkey::from_str(ETH_FEED_PUBLIC_KEY).unwrap(),
        eth_feed_account_info.key,
    )
    .expect("eth_price_account_info_owner");
    assert_pubkeys_exactitude(
        &Pubkey::from_str(BNB_FEED_PUBLIC_KEY).unwrap(),
        bnb_feed_account_info.key,
    )
    .expect("bnb_price_account_info_owner");

    let mpl_token_metadata_id = mpl_token_metadata::id();
    let (nft_edition_key, _nft_edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            mint_account_info.key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&nft_edition_key, nft_edition_account_info.key)
        .expect("Error: @edition_account_info");

    invoke_signed(
        &mpl_token_metadata::instruction::thaw_delegated_account(
            mpl_token_metadata_id,
            mint_authority_key,
            *associated_token_account_info.key,
            nft_edition_key,
            *mint_account_info.key,
        ),
        &[
            freeze_authority_account_info.clone(),
            associated_token_account_info.clone(),
            nft_edition_account_info.clone(),
            mint_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let mut gem_data = GemAccountV0_0_1::validate(GemAccountVersions::decode_unchecked(
        &gem_account_info.data.borrow(),
    )?)?;
    let now = Clock::get()?;
    msg!(
        "now: {}, sedd_time: {}",
        now.unix_timestamp,
        gem_data.rarity_seed_time.unwrap()
    );
    if (now.unix_timestamp as u32) < gem_data.rarity_seed_time.unwrap() {
        Err(InglError::TooEarly.utilize(Some("imprint_rarity")))?
    }
    if let Some(_) = gem_data.rarity {
        Err(ProgramError::InvalidAccountData)?
    }

    let btc_history = AggregatorHistoryBuffer::new(btc_feed_account_info)?;
    let AggregatorHistoryRow {
        value: btc_value,
        timestamp: _,
    } = btc_history
        .lower_bound(gem_data.rarity_seed_time.unwrap() as i64)
        .unwrap();
    let btc_price = btc_value.mantissa * 10.pow(btc_value.scale) as i128;

    let sol_history = AggregatorHistoryBuffer::new(sol_feed_account_info)?;
    let AggregatorHistoryRow {
        value: sol_value,
        timestamp: _,
    } = sol_history
        .lower_bound(gem_data.rarity_seed_time.unwrap() as i64)
        .unwrap();
    let sol_price = sol_value.mantissa * 10.pow(sol_value.scale) as i128;

    let eth_history = AggregatorHistoryBuffer::new(eth_feed_account_info)?;
    let AggregatorHistoryRow {
        value: eth_value,
        timestamp: _,
    } = eth_history
        .lower_bound(gem_data.rarity_seed_time.unwrap() as i64)
        .unwrap();
    let eth_price = eth_value.mantissa * 10.pow(eth_value.scale) as i128;

    let bnb_history = AggregatorHistoryBuffer::new(bnb_feed_account_info)?;
    let AggregatorHistoryRow {
        value: bnb_value,
        timestamp: _,
    } = bnb_history
        .lower_bound(gem_data.rarity_seed_time.unwrap() as i64)
        .unwrap();
    let bnb_price = bnb_value.mantissa * 10.pow(bnb_value.scale) as i128;

    let mut string_to_hash = btc_price.to_string();
    string_to_hash.push_str(sol_price.to_string().as_ref() as &str);
    string_to_hash.push_str(eth_price.to_string().as_ref() as &str);
    string_to_hash.push_str(bnb_price.to_string().as_ref() as &str);
    let rarity_hash_string = hash(string_to_hash.as_bytes());
    let rarity_hash_bytes = rarity_hash_string.to_bytes();

    let mut byte_product: u64 = 0;
    for byte in rarity_hash_bytes {
        byte_product = byte_product + byte as u64;
    }
    let random_value = byte_product * 9999 / (255 * 32) as u64;
    msg!("Bytes product: {:?}", random_value);
    gem_data.rarity = gem_data.class.get_rarity(random_value);

    let mpl_token_metadata_id = mpl_token_metadata::id();
    let metadata_seeds = &[
        PREFIX.as_bytes(),
        mpl_token_metadata_id.as_ref(),
        mint_account_info.key.as_ref(),
    ];

    let (nft_metadata_key, _nft_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata::id());

    assert_pubkeys_exactitude(&nft_metadata_key, metadata_account_info.key)
        .expect("Error: @meta_data_account_info");

    let gem_metadata = Metadata::deserialize(&mut &metadata_account_info.data.borrow()[..])?;

    invoke_signed(
        &mpl_token_metadata::instruction::update_metadata_accounts_v2(
            mpl_token_metadata_id,
            *metadata_account_info.key,
            *freeze_authority_account_info.key,
            Some(*freeze_authority_account_info.key),
            Some(DataV2 {
                uri: String::from(nfts::get_uri(gem_data.class, gem_data.rarity.clone())),
                uses: gem_metadata.uses,
                name: gem_metadata.data.name,
                symbol: gem_metadata.data.symbol,
                collection: gem_metadata.collection,
                creators: gem_metadata.data.creators,
                seller_fee_basis_points: gem_metadata.data.seller_fee_basis_points,
            }),
            Some(gem_metadata.primary_sale_happened),
            Some(gem_metadata.is_mutable),
        ),
        &[
            metadata_account_info.clone(),
            freeze_authority_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;
    gem_data.serialize(&mut &mut gem_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn redeem_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let minting_pool_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let mint_authority_account_info = next_account_info(account_info_iter)?;
    let gem_account_info = next_account_info(account_info_iter)?;
    let metadata_account_info = next_account_info(account_info_iter)?;
    let edition_account_info = next_account_info(account_info_iter)?;
    let ingl_collection_account_info = next_account_info(account_info_iter)?;
    let spl_token_program_account_info = next_account_info(account_info_iter)?;
    let program_treasury_account_info = next_account_info(account_info_iter)?;

    assert_is_signer(payer_account_info).unwrap();
    assert_program_owned(gem_account_info)?;
    assert_owned_by(mint_account_info, &spl_program::id())?;
    assert_owned_by(associated_token_account_info, &spl_program::id())?;
    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("associated_token_account_info");

    let (mint_authority_key, _mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&mint_authority_key, mint_authority_account_info.key)
        .expect("mint_authority_account_info");

    let (minting_pool_id, minting_pool_bump) =
        Pubkey::find_program_address(&[INGL_MINTING_POOL_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&minting_pool_id, minting_pool_account_info.key)
        .expect("Error: @minting_pool_account_info");

    let (gem_pubkey, _gem_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_pubkey, gem_account_info.key).expect("gem_account_info");

    let mpl_token_metadata_id = mpl_token_metadata::id();

    let (edition_key, _edition_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata_id.as_ref(),
            mint_account_info.key.as_ref(),
            b"edition",
        ],
        &mpl_token_metadata_id,
    );
    assert_pubkeys_exactitude(&edition_key, edition_account_info.key)
        .expect("Error: @edition_account_info");

    let metadata_seeds = &[
        PREFIX.as_ref(),
        mpl_token_metadata_id.as_ref(),
        mint_account_info.key.as_ref(),
    ];
    let (nft_metadata_key, _nft_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata_id);

    assert_pubkeys_exactitude(&nft_metadata_key, metadata_account_info.key)
        .expect("Error: @meta_data_account_info");

    let (ingl_nft_collection_key, _ingl_nft_bump) =
        Pubkey::find_program_address(&[INGL_NFT_COLLECTION_KEY.as_ref()], program_id);
    let metadata_seeds = &[
        PREFIX.as_ref(),
        mpl_token_metadata_id.as_ref(),
        ingl_nft_collection_key.as_ref(),
    ];
    let (collection_metadata_key, _collection_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata_id);

    assert_pubkeys_exactitude(&collection_metadata_key, ingl_collection_account_info.key)
        .expect("Error: @collection_metadata_info");

    let associated_token_account_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_account_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    let gem_data = GemAccountV0_0_1::validate(GemAccountVersions::decode_unchecked(
        &gem_account_info.data.borrow(),
    )?)?;

    match gem_data.funds_location {
        FundsLocation::MintingPool => {}
        _ => Err(InglError::InvalidFundsLocation.utilize(Some("gem_account_redeem_nft")))?,
    };

    let now = Clock::get()?.unix_timestamp as u32;
    if gem_data.redeemable_date > now {
        Err(InglError::TooEarly.utilize(Some("redeem_nft")))?;
    }

    let mut redeem_fees: u64 = 0;
    if let Some(val) = gem_data.rarity_seed_time {
        let spent_time = (now - val) as f32 / (60 * 60 * 24 * 365) as f32;

        if spent_time < 1.0 {
            redeem_fees = redeem_fees
                .checked_add(
                    ((1.0 - spent_time.pow(2) as f32).sqrt() * FEE_MULTIPLYER as f32 / 100.0)
                        as u64,
                )
                .ok_or(InglError::BeyondBounds.utilize(Some("overflow or underflow: 1")))
                .unwrap();

            let (program_treasury_id, _treasury_bump) =
                Pubkey::find_program_address(&[INGL_TREASURY_ACCOUNT_KEY.as_ref()], program_id);

            assert_pubkeys_exactitude(&program_treasury_id, program_treasury_account_info.key)
                .expect("Error: @progrma_treasury_account_info");

            let treasury_funds =
                (redeem_fees as f32 * TREASURY_FEE_MULTIPLYER as f32 / 100.0) as u64;
            let mint_authority_funds = redeem_fees
                .checked_sub(treasury_funds)
                .ok_or(InglError::BeyondBounds.utilize(Some("overflow or underflow: 2")))
                .unwrap();

            invoke_signed(
                &system_instruction::transfer(
                    &minting_pool_id,
                    &program_treasury_id,
                    treasury_funds,
                ),
                &[
                    minting_pool_account_info.clone(),
                    program_treasury_account_info.clone(),
                ],
                &[&[INGL_MINTING_POOL_KEY.as_ref(), &[minting_pool_bump]]],
            )?;
            invoke_signed(
                &system_instruction::transfer(
                    &minting_pool_id,
                    &mint_authority_key,
                    mint_authority_funds,
                ),
                &[
                    minting_pool_account_info.clone(),
                    mint_authority_account_info.clone(),
                ],
                &[&[INGL_MINTING_POOL_KEY.as_ref(), &[minting_pool_bump]]],
            )?;
        }
    }

    msg!(
        "Redeem_fees: {:?} lamports: {:?}",
        redeem_fees,
        gem_data.class.get_class_lamports()
    );
    invoke_signed(
        &system_instruction::transfer(
            &minting_pool_id,
            payer_account_info.key,
            gem_data
                .class
                .get_class_lamports()
                .checked_sub(redeem_fees)
                .ok_or(Err(
                    InglError::BeyondBounds.utilize(Some("overflow or underflow"))
                )?)
                .unwrap(),
        ),
        &[
            minting_pool_account_info.clone(),
            payer_account_info.clone(),
        ],
        &[&[INGL_MINTING_POOL_KEY.as_ref(), &[minting_pool_bump]]],
    )?;

    invoke(
        &mpl_token_metadata::instruction::burn_nft(
            mpl_token_metadata_id,
            nft_metadata_key,
            *payer_account_info.key,
            *mint_account_info.key,
            *associated_token_account_info.key,
            edition_key,
            spl_token::id(),
            Some(collection_metadata_key),
        ),
        &[
            metadata_account_info.clone(),
            payer_account_info.clone(),
            mint_account_info.clone(),
            associated_token_account_info.clone(),
            edition_account_info.clone(),
            spl_token_program_account_info.clone(),
            ingl_collection_account_info.clone(),
        ],
    )?;

    let dest_starting_lamports = payer_account_info.lamports();
    **payer_account_info.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(gem_account_info.lamports())
        .unwrap();
    **gem_account_info.lamports.borrow_mut() = 0;

    let mut payer_gem_data = gem_account_info.data.borrow_mut();
    payer_gem_data.fill(0);

    Ok(())
}

pub fn delegate_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let gem_account_data_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let sysvar_clock_info = next_account_info(account_info_iter)?;
    let stake_config_program_info = next_account_info(account_info_iter)?;

    assert_pubkeys_exactitude(sysvar_clock_info.key, &sysvar::clock::id())
        .expect("sysvar clock info");
    assert_pubkeys_exactitude(
        stake_config_program_info.key,
        &solana_program::stake::config::id(),
    )
    .expect("stake config info");

    assert_is_signer(payer_account_info).unwrap();

    let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key)
        .expect("Error: @gem_account_info");

    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("Error: @associated_token_address");
    let associated_token_address_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_address_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    // let (expected_stake_key, _expected_stake_bump) = Pubkey::find_program_address(&[STAKE_ACCOUNT_KEY.as_ref(), vote_account_info.key.as_ref()], program_id);
    // assert_pubkeys_exactitude(&expected_stake_key, stake_account_info.key).expect("stake account info");

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info).expect("ingl vote data account info");
    let mut ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(
        GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?,
    )?;
    let mut global_gem_account_data = GlobalGems::decode(global_gem_account_info)?;

    global_gem_account_data.pd_pool_total = global_gem_account_data
        .pd_pool_total
        .checked_sub(gem_account_data.class.get_class_lamports())
        .unwrap();
    global_gem_account_data.delegated_total = global_gem_account_data
        .delegated_total
        .checked_add(gem_account_data.class.get_class_lamports())
        .unwrap();

    match gem_account_data.funds_location {
        FundsLocation::PDPool => {
            gem_account_data.funds_location = FundsLocation::VoteAccount {
                vote_account_id: *vote_account_info.key,
            };
            gem_account_data.last_delegation_epoch = Some(Clock::get()?.epoch);
        }
        _ => Err(InglError::InvalidFundsLocation.utilize(Some("gem's funds location.")))?,
    }

    if ingl_vote_account_data.dealloced >= gem_account_data.class.get_class_lamports() {
        global_gem_account_data.dealloced_total = global_gem_account_data
            .dealloced_total
            .checked_sub(gem_account_data.class.get_class_lamports())
            .unwrap();
        ingl_vote_account_data.dealloced = ingl_vote_account_data
            .dealloced
            .checked_sub(gem_account_data.class.get_class_lamports())
            .unwrap();
    } else {
        ingl_vote_account_data.pending_delegation_total = ingl_vote_account_data
            .pending_delegation_total
            .checked_add(gem_account_data.class.get_class_lamports())
            .unwrap();
        global_gem_account_data.pending_delegation_total = global_gem_account_data
            .pending_delegation_total
            .checked_add(gem_account_data.class.get_class_lamports())
            .unwrap();
    }

    if ingl_vote_account_data
        .total_delegated
        .checked_add(gem_account_data.class.get_class_lamports())
        .unwrap()
        > MAXIMUM_DELEGATABLE_STAKE
    {
        Err(InglError::BeyondBounds.utilize(Some("Total stake will Exceed maximum allowed")))?
    }
    ingl_vote_account_data.total_delegated = ingl_vote_account_data
        .total_delegated
        .checked_add(gem_account_data.class.get_class_lamports())
        .unwrap();

    global_gem_account_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;
    gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;
    ingl_vote_account_data
        .serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn undelegate_nft(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let pd_pool_account_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let gem_account_data_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;

    assert_is_signer(payer_account_info).unwrap();

    let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key)
        .expect("Error: @gem_account_info");

    assert_pubkeys_exactitude(
        &get_associated_token_address(payer_account_info.key, mint_account_info.key),
        associated_token_account_info.key,
    )
    .expect("Error: @associated_token_address");
    let associated_token_address_data =
        Account::unpack(&associated_token_account_info.data.borrow())?;
    if associated_token_address_data.amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info)?;
    let mut ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    let (pd_pool_pubkey, _pd_pool_bump) =
        Pubkey::find_program_address(&[PD_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&pd_pool_pubkey, pd_pool_account_info.key)
        .expect("Error: @pd_pool_account_info");
    let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(
        GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?,
    )?;
    let mut global_gem_account_data = GlobalGems::decode(global_gem_account_info)?;
    global_gem_account_data.pd_pool_total = global_gem_account_data
        .pd_pool_total
        .checked_add(gem_account_data.class.get_class_lamports())
        .unwrap();
    global_gem_account_data.delegated_total = global_gem_account_data
        .delegated_total
        .checked_sub(gem_account_data.class.get_class_lamports())
        .unwrap();
    ingl_vote_account_data.total_delegated = ingl_vote_account_data
        .total_delegated
        .checked_sub(gem_account_data.class.get_class_lamports())
        .unwrap();

    if global_gem_account_data.pending_delegation_total
        > gem_account_data.class.get_class_lamports()
    {
        ingl_vote_account_data.pending_delegation_total = ingl_vote_account_data
            .pending_delegation_total
            .checked_sub(gem_account_data.class.get_class_lamports())
            .unwrap();
        global_gem_account_data.pending_delegation_total = global_gem_account_data
            .pending_delegation_total
            .checked_sub(gem_account_data.class.get_class_lamports())
            .unwrap();
    } else {
        global_gem_account_data.dealloced_total = global_gem_account_data
            .dealloced_total
            .checked_add(gem_account_data.class.get_class_lamports())
            .unwrap();
        ingl_vote_account_data.dealloced = ingl_vote_account_data
            .dealloced
            .checked_add(gem_account_data.class.get_class_lamports())
            .unwrap();
    }

    match gem_account_data.funds_location {
        FundsLocation::VoteAccount { vote_account_id } => {
            assert_pubkeys_exactitude(&vote_account_id, vote_account_info.key)
                .expect("vote account sent isn't that expected");
            gem_account_data.funds_location = FundsLocation::PDPool;
        }
        _ => Err(InglError::InvalidFundsLocation.utilize(Some("gem's funds location.")))?,
    }

    global_gem_account_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;
    ingl_vote_account_data
        .serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;
    gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn process_rewards(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let _payer_account_info = next_account_info(account_info_iter)?;
    let validator_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let authorized_withdrawer_info = next_account_info(account_info_iter)?;
    let mint_authority_account_info = next_account_info(account_info_iter)?;
    let treasury_account_info = next_account_info(account_info_iter)?;

    let (mint_authority_key, _mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&mint_authority_key, mint_authority_account_info.key)
        .expect("Error: @mint_authority_account_info");

    let (treasury_key, _treasury_bump) =
        Pubkey::find_program_address(&[TREASURY_ACCOUNT_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&treasury_key, treasury_account_info.key)
        .expect("Error: @Treasury_account_info");

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info)?;
    let mut ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    let validator_id = ingl_vote_account_data.validator_id;
    assert_pubkeys_exactitude(&validator_id, validator_info.key).expect("validator_id");

    let (authorized_withdrawer, authorized_withdrawer_bump) =
        Pubkey::find_program_address(&[AUTHORIZED_WITHDRAWER_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(authorized_withdrawer_info.key, &authorized_withdrawer)
        .expect("vote account pubkey is dissimilar to the expected vote pubkey");

    let lamports = vote_account_info
        .lamports()
        .checked_sub(Rent::get()?.minimum_balance(vote_account_info.data_len()))
        .unwrap();
    let one_percent: u64 = lamports.checked_div(100).unwrap();

    invoke_signed(
        &vote_withdraw(
            vote_account_info.key,
            authorized_withdrawer_info.key,
            lamports,
            &authorized_withdrawer,
        ),
        &[
            vote_account_info.clone(),
            authorized_withdrawer_info.clone(),
            authorized_withdrawer_info.clone(),
        ],
        &[&[
            AUTHORIZED_WITHDRAWER_KEY.as_ref(),
            &[authorized_withdrawer_bump],
        ]],
    )?;

    if ingl_vote_account_data.vote_rewards[ingl_vote_account_data.vote_rewards.len() - 1]
        .epoch_number
        >= Clock::get()?.epoch
    {
        Err(InglError::TooEarly.utilize(Some("processing reward")))?
    }

    invoke_signed(
        &system_instruction::transfer(
            authorized_withdrawer_info.key,
            mint_authority_account_info.key,
            one_percent.checked_mul(TEAM_SHARE).unwrap(),
        ),
        &[
            authorized_withdrawer_info.clone(),
            mint_authority_account_info.clone(),
        ],
        &[&[
            AUTHORIZED_WITHDRAWER_KEY.as_ref(),
            &[authorized_withdrawer_bump],
        ]],
    )?;

    invoke_signed(
        &system_instruction::transfer(
            authorized_withdrawer_info.key,
            validator_info.key,
            one_percent.checked_mul(VALIDATOR_ID_SHARE).unwrap(),
        ),
        &[authorized_withdrawer_info.clone(), validator_info.clone()],
        &[&[
            AUTHORIZED_WITHDRAWER_KEY.as_ref(),
            &[authorized_withdrawer_bump],
        ]],
    )?;

    invoke_signed(
        &system_instruction::transfer(
            authorized_withdrawer_info.key,
            treasury_account_info.key,
            one_percent.checked_mul(TREASURY_SHARE).unwrap(),
        ),
        &[
            authorized_withdrawer_info.clone(),
            treasury_account_info.clone(),
        ],
        &[&[
            AUTHORIZED_WITHDRAWER_KEY.as_ref(),
            &[authorized_withdrawer_bump],
        ]],
    )?;

    ingl_vote_account_data.vote_rewards.push(VoteRewards {
        validation_phrase: VOTE_REWARDS_VAL_PHRASE,
        epoch_number: Clock::get()?.epoch,
        total_stake: ingl_vote_account_data.total_delegated,
        total_reward: lamports,
    });
    ingl_vote_account_data.last_withdraw_epoch = Clock::get()?.epoch;

    ingl_vote_account_data
        .serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn nft_withdraw(program_id: &Pubkey, accounts: &[AccountInfo], cnt: usize) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let validator_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let authorized_withdrawer_info = next_account_info(account_info_iter)?;

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info)?;
    let ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    let (authorized_withdrawer, authorized_withdrawer_bump) =
        Pubkey::find_program_address(&[AUTHORIZED_WITHDRAWER_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(authorized_withdrawer_info.key, &authorized_withdrawer)
        .expect("vote account pubkey is dissimilar to the expected vote pubkey");

    let validator_id = ingl_vote_account_data.validator_id;
    assert_pubkeys_exactitude(&validator_id, validator_info.key).expect("validator_id");

    assert_is_signer(payer_account_info)
        .expect("Payer must be Signer, couldn't find its signature");
    let mut general_rewards: u64 = 0;
    for _ in 0..cnt {
        let associated_token_account_info = next_account_info(account_info_iter)?;
        let mint_account_info = next_account_info(account_info_iter)?;
        let gem_account_data_info = next_account_info(account_info_iter)?;

        let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
            &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
            program_id,
        );
        assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key)
            .expect("Error: @gem_account_info");

        assert_program_owned(gem_account_data_info)?;
        assert_owned_by(mint_account_info, &spl_program::id())?;
        assert_owned_by(associated_token_account_info, &spl_program::id())?;

        assert_pubkeys_exactitude(
            &get_associated_token_address(payer_account_info.key, mint_account_info.key),
            associated_token_account_info.key,
        )
        .expect("Error: @associated_token_address");
        let associated_token_address_data =
            Account::unpack(&associated_token_account_info.data.borrow())?;
        if associated_token_address_data.amount != 1 {
            Err(ProgramError::InsufficientFunds)?
        }

        let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(
            GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?,
        )?;
        if let FundsLocation::VoteAccount { vote_account_id } = gem_account_data.funds_location {
            assert_pubkeys_exactitude(&vote_account_id, vote_account_info.key)
                .expect("Error: @vote_account_info in funds location");
        } else {
            Err(InglError::InvalidFundsLocation.utilize(Some("Gem's fund location")))?
        }

        let interested_epoch = gem_account_data
            .last_withdrawal_epoch
            .unwrap()
            .max(gem_account_data.last_delegation_epoch.unwrap());
        let interested_index = 1 + ingl_vote_account_data
            .vote_rewards
            .iter()
            .position(|x| x.epoch_number == interested_epoch)
            .expect("couldn't fine the last withdrawal epoch");
        let mut total_reward: u64 = 0;
        for i in interested_index..ingl_vote_account_data.vote_rewards.len() {
            let epoch_reward = ingl_vote_account_data.vote_rewards[i];
            total_reward = total_reward
                .checked_add(
                    (gem_account_data.class.get_class_lamports() as f64
                        * (NFTS_SHARE as f64 * (epoch_reward.total_reward as f64 / 100.0)
                            / epoch_reward.total_stake as f64)) as u64,
                )
                .unwrap(); //unsafe Get back to this Cyrial
        }
        gem_account_data.last_withdrawal_epoch = Some(Clock::get()?.epoch);
        gem_account_data.all_withdraws.push(total_reward);
        general_rewards = general_rewards.checked_add(total_reward).unwrap();
        gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;
    }

    invoke_signed(
        &system_instruction::transfer(
            authorized_withdrawer_info.key,
            payer_account_info.key,
            general_rewards,
        ),
        &[
            authorized_withdrawer_info.clone(),
            payer_account_info.clone(),
        ],
        &[&[
            AUTHORIZED_WITHDRAWER_KEY.as_ref(),
            &[authorized_withdrawer_bump],
        ]],
    )?;

    Ok(())
}

pub fn close_proposal(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let _payer_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;

    assert_program_owned(ingl_vote_data_account_info)?;
    let ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);

    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");
    assert_program_owned(global_gem_account_info)?;
    let mut global_gem_account_data = GlobalGems::decode(global_gem_account_info)?;

    if global_gem_account_data.pd_pool_total < MAXIMUM_DELEGATABLE_STAKE {
        Err(InglError::TooEarly.utilize(Some("pd_pool_total")))?
    }

    let (expected_vote_pubkey, _expected_vote_pubkey_bump) = Pubkey::find_program_address(
        &[
            VOTE_ACCOUNT_KEY.as_ref(),
            &(global_gem_account_data.proposal_numeration - 1).to_be_bytes(),
        ],
        program_id,
    );
    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            &expected_vote_pubkey.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");

    if ingl_vote_account_data
        .total_delegated
        .checked_add(ingl_vote_account_data.dealloced)
        .unwrap()
        .checked_mul(100)
        .unwrap()
        < MAXIMUM_DELEGATABLE_STAKE.checked_mul(90).unwrap()
    {
        Err(InglError::TooEarly.utilize(Some("Total accumulated not yet equal to that expected")))?
    }

    global_gem_account_data.is_proposal_ongoing = false;
    global_gem_account_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    Ok(())
}

pub fn init_rebalance(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let _payer_account_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let validator_account_info = next_account_info(account_info_iter)?;
    let t_stake_account_info = next_account_info(account_info_iter)?;
    let pd_pool_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let sysvar_clock_info = next_account_info(account_info_iter)?;
    let sysvar_rent_info = next_account_info(account_info_iter)?;
    let stake_account_info = next_account_info(account_info_iter)?;
    let t_withdraw_info = next_account_info(account_info_iter)?;

    let (pd_pool_pubkey, pd_pool_bump) =
        Pubkey::find_program_address(&[PD_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&pd_pool_pubkey, pd_pool_account_info.key)
        .expect("Error: @pd_pool_account_info");

    let (expected_t_stake_key, expected_t_stake_bump) = Pubkey::find_program_address(
        &[T_STAKE_ACCOUNT_KEY.as_ref(), vote_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_t_stake_key, t_stake_account_info.key)?;

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info)?;
    let mut ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    let (global_gem_pubkey, _global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&global_gem_pubkey, global_gem_account_info.key)
        .expect("Error: @global_gem_account_info");

    assert_pubkeys_exactitude(
        &ingl_vote_account_data.validator_id,
        validator_account_info.key,
    )?;

    let (expected_stake_key, _expected_stake_bump) = Pubkey::find_program_address(
        &[STAKE_ACCOUNT_KEY.as_ref(), vote_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_stake_key, stake_account_info.key)
        .expect("stake account info");

    let mut global_gem_data = GlobalGems::decode(global_gem_account_info)?;

    let (expected_t_withdraw_key, t_withdraw_bump) = Pubkey::find_program_address(
        &[T_WITHDRAW_KEY.as_ref(), vote_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_t_withdraw_key, t_withdraw_info.key)
        .expect("Error: @t_withdraw info");

    let val_owners_lamports = if let Some(_) = ingl_vote_account_data.pending_validator_rewards {
        Err(InglError::TooLate.utilize(Some("Rebalancing is already ongoing.")))?
    } else {
        Some(
            stake_account_info
                .lamports()
                .checked_sub(ingl_vote_account_data.last_total_staked)
                .unwrap(),
        )
    };
    let mut split_lamports = val_owners_lamports.unwrap();
    if ingl_vote_account_data.pending_delegation_total >= ingl_vote_account_data.dealloced {
        let lamports = ingl_vote_account_data
            .pending_delegation_total
            .checked_sub(ingl_vote_account_data.dealloced)
            .unwrap();
        invoke_signed(
            &system_instruction::create_account(
                pd_pool_account_info.key,
                &expected_t_stake_key,
                lamports,
                std::mem::size_of::<StakeState>() as u64,
                &stake::program::id(),
            ),
            &[pd_pool_account_info.clone(), t_stake_account_info.clone()],
            &[
                &[PD_POOL_KEY.as_ref(), &[pd_pool_bump]],
                &[
                    T_STAKE_ACCOUNT_KEY.as_ref(),
                    vote_account_info.key.as_ref(),
                    &[expected_t_stake_bump],
                ],
            ],
        )?;

        let authorized = &Authorized {
            staker: *pd_pool_account_info.key,
            withdrawer: *pd_pool_account_info.key,
        };
        let lockup = &Lockup {
            unix_timestamp: 0,
            epoch: 0,
            custodian: *pd_pool_account_info.key,
        };

        // msg!("Initializing stake");
        invoke(
            &solana_program::stake::instruction::initialize(
                t_stake_account_info.key,
                authorized,
                lockup,
            ),
            &[t_stake_account_info.clone(), sysvar_rent_info.clone()],
        )?;
        ingl_vote_account_data.is_t_stake_initialized = true;
    } else {
        split_lamports = split_lamports
            .checked_add(
                ingl_vote_account_data
                    .dealloced
                    .checked_sub(ingl_vote_account_data.total_delegated)
                    .unwrap(),
            )
            .unwrap();
        ingl_vote_account_data.is_t_stake_initialized = false;
    }
    invoke_signed(
        &system_instruction::allocate(
            t_withdraw_info.key,
            std::mem::size_of::<StakeState>() as u64,
        ),
        &[t_withdraw_info.clone()],
        &[&[
            T_WITHDRAW_KEY.as_ref(),
            vote_account_info.key.as_ref(),
            &[t_withdraw_bump],
        ]],
    )?;
    invoke_signed(
        &system_instruction::assign(t_withdraw_info.key, &stake::program::id()),
        &[t_withdraw_info.clone()],
        &[&[
            T_WITHDRAW_KEY.as_ref(),
            vote_account_info.key.as_ref(),
            &[t_withdraw_bump],
        ]],
    )?;

    invoke_signed(
        &split(
            stake_account_info.key,
            pd_pool_account_info.key,
            split_lamports,
            t_withdraw_info.key,
        ),
        &[
            stake_account_info.clone(),
            t_withdraw_info.clone(),
            pd_pool_account_info.clone(),
        ],
        &[&[PD_POOL_KEY.as_ref(), &[pd_pool_bump]]],
    )?;

    invoke_signed(
        &solana_program::stake::instruction::deactivate_stake(t_withdraw_info.key, &pd_pool_pubkey),
        &[
            t_withdraw_info.clone(),
            sysvar_clock_info.clone(),
            pd_pool_account_info.clone(),
        ],
        &[&[PD_POOL_KEY.as_ref(), &[pd_pool_bump]]],
    )?;

    global_gem_data.pending_delegation_total = global_gem_data
        .pending_delegation_total
        .checked_sub(ingl_vote_account_data.pending_delegation_total)
        .unwrap();
    ingl_vote_account_data.pending_delegation_total = 0;
    global_gem_data.dealloced_total = global_gem_data
        .dealloced_total
        .checked_sub(ingl_vote_account_data.dealloced)
        .unwrap();
    ingl_vote_account_data.dealloced = 0;
    ingl_vote_account_data.pending_validator_rewards = val_owners_lamports;

    ingl_vote_account_data
        .serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;
    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn finalize_rebalance(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let _payer_account_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let validator_account_info = next_account_info(account_info_iter)?;
    let t_stake_account_info = next_account_info(account_info_iter)?;
    let pd_pool_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let sysvar_clock_info = next_account_info(account_info_iter)?;
    let sysvar_rent_info = next_account_info(account_info_iter)?;
    let stake_account_info = next_account_info(account_info_iter)?;
    let t_withdraw_info = next_account_info(account_info_iter)?;
    let sysvar_stake_history_info = next_account_info(account_info_iter)?;

    let (pd_pool_pubkey, pd_pool_bump) =
        Pubkey::find_program_address(&[PD_POOL_KEY.as_ref()], program_id);
    assert_pubkeys_exactitude(&pd_pool_pubkey, pd_pool_account_info.key)
        .expect("Error: @pd_pool_account_info");

    let (expected_t_stake_key, _expected_t_stake_bump) = Pubkey::find_program_address(
        &[T_STAKE_ACCOUNT_KEY.as_ref(), vote_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_t_stake_key, t_stake_account_info.key)?;

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(
        &[
            VOTE_DATA_ACCOUNT_KEY.as_ref(),
            vote_account_info.key.as_ref(),
        ],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key)
        .expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info)?;
    let mut ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;

    assert_pubkeys_exactitude(sysvar_stake_history_info.key, &sysvar::stake_history::id())?;
    assert_pubkeys_exactitude(
        &ingl_vote_account_data.validator_id,
        validator_account_info.key,
    )?;

    let (expected_stake_key, _expected_stake_bump) = Pubkey::find_program_address(
        &[STAKE_ACCOUNT_KEY.as_ref(), vote_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_stake_key, stake_account_info.key)
        .expect("stake account info");

    let (expected_t_withdraw_key, _t_withdraw_bump) = Pubkey::find_program_address(
        &[T_WITHDRAW_KEY.as_ref(), vote_account_info.key.as_ref()],
        program_id,
    );
    assert_pubkeys_exactitude(&expected_t_withdraw_key, t_withdraw_info.key)
        .expect("Error: @t_withdraw info");

    if ingl_vote_account_data.is_t_stake_initialized {
        invoke_signed(
            &solana_program::stake::instruction::merge(
                stake_account_info.key,
                t_stake_account_info.key,
                pd_pool_account_info.key,
            )[0],
            &[
                stake_account_info.clone(),
                t_stake_account_info.clone(),
                sysvar_clock_info.clone(),
                sysvar_rent_info.clone(),
                pd_pool_account_info.clone(),
            ],
            &[&[PD_POOL_KEY.as_ref(), &[pd_pool_bump]]],
        )?;
    }
    // let lamports = if let Some(dlamports) = ingl_vote_account_data.pending_validator_rewards{dlamports} else {Err(InglError::TooEarly.utilize(Some("init rebalance not active"))).unwrap()};
    invoke_signed(
        &solana_program::stake::instruction::withdraw(
            t_withdraw_info.key,
            pd_pool_account_info.key,
            validator_account_info.key,
            if let Some(dlamports) = ingl_vote_account_data.pending_validator_rewards {
                dlamports
            } else {
                Err(InglError::TooEarly.utilize(Some("init rebalance not active")))?
            },
            None,
        ),
        &[
            t_withdraw_info.clone(),
            validator_account_info.clone(),
            sysvar_clock_info.clone(),
            sysvar_stake_history_info.clone(),
            pd_pool_account_info.clone(),
        ],
        &[&[PD_POOL_KEY.as_ref(), &[pd_pool_bump]]],
    )?;

    invoke_signed(
        &solana_program::stake::instruction::withdraw(
            t_withdraw_info.key,
            pd_pool_account_info.key,
            validator_account_info.key,
            t_withdraw_info.lamports(),
            None,
        ),
        &[
            t_withdraw_info.clone(),
            validator_account_info.clone(),
            sysvar_clock_info.clone(),
            sysvar_stake_history_info.clone(),
            pd_pool_account_info.clone(),
        ],
        &[&[PD_POOL_KEY.as_ref(), &[pd_pool_bump]]],
    )?;

    ingl_vote_account_data.pending_validator_rewards = None;
    ingl_vote_account_data.last_total_staked = stake_account_info.lamports();

    ingl_vote_account_data
        .serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;
    Ok(())
}

pub fn inject_testing_data(program_id: &Pubkey, accounts: &[AccountInfo], num_mints: u32) -> ProgramResult{
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let vote_account_info = next_account_info(account_info_iter)?;
    let ingl_vote_data_account_info = next_account_info(account_info_iter)?;
    let authorized_withdrawer_info = next_account_info(account_info_iter)?;

    let (expected_vote_data_pubkey, _expected_vote_data_bump) = Pubkey::find_program_address(&[VOTE_DATA_ACCOUNT_KEY.as_ref(), vote_account_info.key.as_ref()], program_id);
    assert_pubkeys_exactitude(&expected_vote_data_pubkey, ingl_vote_data_account_info.key).expect("Error: @vote_data_account_info");
    assert_program_owned(ingl_vote_data_account_info)?;
    let mut ingl_vote_account_data = InglVoteAccountData::decode(ingl_vote_data_account_info)?;
    
    let chosen_epoch = Clock::get()?.epoch.saturating_sub(2);
    for _ in 0..num_mints{
        let mint_account_info = next_account_info(account_info_iter)?;
        let gem_account_data_info = next_account_info(account_info_iter)?;

        let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
            &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
            program_id,
        );
        assert_pubkeys_exactitude(&gem_account_pubkey, gem_account_data_info.key).expect("Error: @gem_account_info");
        assert_program_owned(gem_account_data_info)?;
        assert_owned_by(mint_account_info, &spl_program::id())?;
        let mut gem_account_data: GemAccountV0_0_1 = GemAccountV0_0_1::validate(GemAccountVersions::decode_unchecked(&gem_account_data_info.data.borrow())?)?;

        if let FundsLocation::VoteAccount { vote_account_id } = gem_account_data.funds_location{
            assert_pubkeys_exactitude(&vote_account_id, vote_account_info.key)?;
        }
        gem_account_data.last_delegation_epoch = Some(chosen_epoch-1);
        gem_account_data.last_withdrawal_epoch = Some(chosen_epoch-1);
        gem_account_data.serialize(&mut &mut gem_account_data_info.data.borrow_mut()[..])?;        
    }
    invoke(
        &system_instruction::transfer(payer_account_info.key, authorized_withdrawer_info.key, LAMPORTS_PER_SOL.checked_mul(12_000).unwrap().checked_div(10_000).unwrap()),
        &[payer_account_info.clone(), authorized_withdrawer_info.clone()]
    )?;
    // ingl_vote_account_data.vote_rewards = Vec::new();
    ingl_vote_account_data.vote_rewards.push(VoteRewards{validation_phrase: VOTE_REWARDS_VAL_PHRASE, epoch_number: chosen_epoch-1, total_stake: ingl_vote_account_data.total_delegated, total_reward: 1 * LAMPORTS_PER_SOL });
    ingl_vote_account_data.vote_rewards.push(VoteRewards{validation_phrase: VOTE_REWARDS_VAL_PHRASE, epoch_number: chosen_epoch, total_stake: ingl_vote_account_data.total_delegated, total_reward: 2*LAMPORTS_PER_SOL });
    ingl_vote_account_data.last_withdraw_epoch = chosen_epoch-1;
    // ingl_vote_account_data.pending_validator_rewards = Some(1*LAMPORTS_PER_SOL);



    ingl_vote_account_data.serialize(&mut &mut ingl_vote_data_account_info.data.borrow_mut()[..])?;

    Ok(())
}
