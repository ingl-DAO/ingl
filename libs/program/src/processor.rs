use std::str::FromStr;

use crate::state::{constants::*, Class, GlobalGems, Rarity};
use crate::{
    error::InglError,
    instruction::InstructionEnum,
    nfts,
    state::{FundsLocation, GemAccountV0_0_1, GemAccountVersions},
};
use borsh::BorshSerialize;
use mpl_token_metadata::{
    self,
    state::{Creator, PREFIX},
};
use num_traits::Pow;
use solana_program::hash::hash;
use solana_program::program_pack::Pack;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh::try_from_slice_unchecked,
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction, system_program,
    sysvar::Sysvar,
};
use spl_associated_token_account::{get_associated_token_address, *};
use spl_token::{instruction::AuthorityType, state::Account};
use switchboard_v2::{
    AggregatorHistoryBuffer, AggregatorHistoryRow, SWITCHBOARD_V2_DEVNET, SWITCHBOARD_V2_MAINNET,
};

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    Ok(match InstructionEnum::decode(instruction_data) {
        InstructionEnum::MintNewCollection => mint_collection(program_id, accounts)?,
        InstructionEnum::MintNft(class) => mint_nft(program_id, accounts, class)?,
        InstructionEnum::InitRarityImprint => init_rarity_imprint(program_id, accounts)?,
        InstructionEnum::ImprintRarity => imprint_rarity(program_id, accounts)?,
        _ => Err(ProgramError::InvalidInstructionData)?,
    })
}

pub fn mint_nft(program_id: &Pubkey, accounts: &[AccountInfo], class: Class) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let mint_authority_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let spl_token_program_account_info = next_account_info(account_info_iter)?;
    let sysvar_rent_accoount_info = next_account_info(account_info_iter)?;
    let system_program_account_info = next_account_info(account_info_iter)?;
    let metadata_account_info = next_account_info(account_info_iter)?;
    let minting_pool_account_info = next_account_info(account_info_iter)?;
    let global_gem_account_info = next_account_info(account_info_iter)?;
    let gem_account_info = next_account_info(account_info_iter)?;
    let sysvar_clock_info = next_account_info(account_info_iter)?;
    let edition_account_info = next_account_info(account_info_iter)?;
    let ingl_collection_mint_info = next_account_info(account_info_iter)?;
    let ingl_collection_account_info = next_account_info(account_info_iter)?;

    let clock = Clock::from_account_info(&sysvar_clock_info)?;
    // Getting timestamp
    let current_timestamp = clock.unix_timestamp as u32;

    let (gem_account_pubkey, gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );
    if gem_account_pubkey != *gem_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("gem_account_info"))?
    }
    let space = 50;
    let rent_lamports = Rent::get()?.minimum_balance(space);
    msg!("Reached invoke");
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

    if global_gem_pubkey != *global_gem_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("global_gem_account_info"))?
    }
    let mut global_gem_data: GlobalGems =
        try_from_slice_unchecked(&global_gem_account_info.data.borrow())?;

    let space = 82;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    let (minting_pool_id, _minting_pool_bump) =
        Pubkey::find_program_address(&[INGL_MINTING_POOL_KEY.as_ref()], program_id);

    if minting_pool_id != *minting_pool_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("minting_pool_account_info"))?
    }

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);

    if mint_authority_key != *mint_authority_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("mint_authority_account_info"))?
    }

    if get_associated_token_address(payer_account_info.key, mint_account_info.key)
        != *associated_token_account_info.key
    {
        Err(InglError::KeyPairMismatch.utilize("associated_token_account_info"))?
    }

    if !system_program::check_id(system_program_account_info.key) {
        Err(InglError::KeyPairMismatch.utilize("system_program_account_info"))?
    }

    if spl_token::id() != *spl_token_program_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("spl_token_program_account_info"))?
    }

    let mpl_token_metadata_id = mpl_token_metadata::id();
    let metadata_seeds = &[
        PREFIX.as_bytes(),
        mpl_token_metadata_id.as_ref(),
        mint_account_info.key.as_ref(),
    ];

    let (nft_metadata_key, _nft_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata::id());

    if nft_metadata_key != *metadata_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("meta_data_account_info"))?
    }

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
        &[mint_account_info.clone(), sysvar_rent_accoount_info.clone()],
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

    msg!("Mint new collection token");
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

    if ingl_nft_collection_key != *ingl_collection_mint_info.key {
        Err(InglError::KeyPairMismatch.utilize("ingl_collection_account_info"))?;
    }

    let metadata_seeds = &[
        PREFIX.as_ref(),
        mpl_token_metadata_id.as_ref(),
        ingl_nft_collection_key.as_ref(),
    ];

    let (collection_metadata_key, _collection_metadata_bump) =
        Pubkey::find_program_address(metadata_seeds, &mpl_token_metadata_id);

    if collection_metadata_key != *ingl_collection_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("collection_metadata_info"))?
    }

    msg!("starting metadata creation");
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
            sysvar_rent_accoount_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
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
    if edition_key != *edition_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("edition_account_info"))?
    }
    // msg!("verifying collection");
    // invoke_signed(
    //     &mpl_token_metadata::instruction::set_and_verify_collection(
    //         mpl_token_metadata_id,
    //         nft_metadata_key,
    //         mint_authority_key,
    //         *payer_account_info.key,
    //         mint_authority_key,
    //         ingl_nft_collection_key,
    //         collection_metadata_key,
    //         *edition_account_info.key,
    //         None),
    //         &[
    //             metadata_account_info.clone(),
    //             mint_authority_account_info.clone(),
    //             payer_account_info.clone(),
    //             mint_authority_account_info.clone(),
    //             ingl_collection_mint_info.clone(),
    //             ingl_collection_account_info.clone(),
    //             edition_account_info.clone(),
    //         ],
    //         &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]]
    // )?;
    msg!("setting authority");
    invoke_signed(
        &spl_token::instruction::set_authority(
            spl_token_program_account_info.key,
            mint_account_info.key,
            None,
            AuthorityType::MintTokens,
            &mint_authority_key,
            &[],
        )?,
        &[
            mint_account_info.clone(),
            mint_authority_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;
    msg!("updating update_primary_sale_happened_via_token");
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
        date_created: current_timestamp,
        redeemable_data: current_timestamp,
        numeration: global_gem_data.counter,
        rarity: None,
        funds_location: FundsLocation::MintingPool,
        future_price_time: None,
    };
    gem_account_data.serialize(&mut &mut gem_account_info.data.borrow_mut()[..])?;
    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;
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

    let (global_gem_pubkey, global_gem_bump) =
        Pubkey::find_program_address(&[GLOBAL_GEM_KEY.as_ref()], program_id);

    if global_gem_pubkey != *global_gem_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("global_gem_account_info"))?
    }

    let space = 50;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    msg!("Create global_gem account");
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
        counter: 0,
        total_raised: 0,
    };
    global_gem_data.serialize(&mut &mut global_gem_account_info.data.borrow_mut()[..])?;

    let (ingl_nft_collection_key, ingl_nft_bump) =
        Pubkey::find_program_address(&[INGL_NFT_COLLECTION_KEY.as_ref()], program_id);

    if ingl_nft_collection_key != *mint_account_info.key {
        msg!("Mint account info don't match");
        Err(InglError::KeyPairMismatch.utilize("Mint_account_info"))?
    }

    let space = 82;
    let rent_lamports = Rent::get()?.minimum_balance(space);

    msg!("Create mint account");
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

    if mint_authority_key != *mint_authority_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("mint_authority_account_info"))?
    }

    msg!("Initialize mint account");
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
    if collection_holder_key != *collection_holder_info.key {
        Err(InglError::KeyPairMismatch.utilize("collection_holder_info"))?
    }

    let collection_associated_pubkey = spl_associated_token_account::get_associated_token_address(
        &collection_holder_key,
        mint_account_info.key,
    );
    if &collection_associated_pubkey != associated_token_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("Associated_token_account"))?
    }

    msg!("Create associated token account");
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

    msg!("Mint new collection token");
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

    if nft_metadata_key != *metadata_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("nft_meta_data_account_info"))?
    }

    msg!("Create metaplex nft account v3");
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
    if edition_key != *edition_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("edition_account_info"))?
    }

    msg!("Creating master Edition account...");
    invoke_signed(
        &mpl_token_metadata::instruction::create_master_edition_v3(
            mpl_token_metadata_id,
            edition_key,
            *mint_account_info.key,
            mint_authority_key,
            mint_authority_key,
            nft_metadata_key,
            *payer_account_info.key,
            None,
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

    // Err(InglError::KeyPairMismatch.utilize("There was actually no Error found, Tada"))?
    Ok(())
}

pub fn init_rarity_imprint(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer_account_info = next_account_info(account_info_iter)?;
    let gem_account_info = next_account_info(account_info_iter)?;
    let mint_account_info = next_account_info(account_info_iter)?;
    let associated_token_account_info = next_account_info(account_info_iter)?;
    let freeze_authority_account_info = next_account_info(account_info_iter)?;

    let (gem_account_pubkey, _gem_account_bump) = Pubkey::find_program_address(
        &[GEM_ACCOUNT_CONST.as_ref(), mint_account_info.key.as_ref()],
        program_id,
    );

    if gem_account_pubkey != *gem_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("gem_account_info"))?
    }

    if get_associated_token_address(payer_account_info.key, mint_account_info.key)
        != *associated_token_account_info.key
    {
        Err(InglError::KeyPairMismatch.utilize("associated_token_account_info"))?
    }

    if !payer_account_info.is_signer {
        Err(ProgramError::MissingRequiredSignature)?
    }

    let Account { amount, .. } = Account::unpack(&associated_token_account_info.data.borrow())?;
    if amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);

    if mint_authority_key != *freeze_authority_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("freeze_authority_account_info"))?
    }

    let mut gem_data: GemAccountV0_0_1 = try_from_slice_unchecked(&gem_account_info.data.borrow())?;
    gem_data.future_price_time =
        Some(Clock::get()?.unix_timestamp as u32 + PRICE_TIME_INTERVAL as u32);
    gem_data.serialize(&mut &mut gem_account_info.data.borrow_mut()[..])?;

    invoke_signed(
        &spl_token::instruction::freeze_account(
            &spl_token::id(),
            associated_token_account_info.key,
            mint_account_info.key,
            freeze_authority_account_info.key,
            &[],
        )?,
        &[
            associated_token_account_info.clone(),
            mint_account_info.clone(),
            freeze_authority_account_info.clone(),
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

    let btc_feed_account_info = next_account_info(account_info_iter)?;
    let sol_feed_account_info = next_account_info(account_info_iter)?;
    let eth_feed_account_info = next_account_info(account_info_iter)?;
    let bnb_feed_account_info = next_account_info(account_info_iter)?;

    if get_associated_token_address(payer_account_info.key, mint_account_info.key)
        != *associated_token_account_info.key
    {
        Err(InglError::KeyPairMismatch.utilize("associated_token_account_info"))?
    }

    if !payer_account_info.is_signer {
        Err(ProgramError::MissingRequiredSignature)?
    }

    let Account { amount, .. } = Account::unpack(&associated_token_account_info.data.borrow())?;
    if amount != 1 {
        Err(ProgramError::InsufficientFunds)?
    }

    let (mint_authority_key, mint_authority_bump) =
        Pubkey::find_program_address(&[INGL_MINT_AUTHORITY_KEY.as_ref()], program_id);
    if mint_authority_key != *freeze_authority_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("freeze_authority_account_info"))?
    }

    let (gem_pubkey, _gem_bump) =
        Pubkey::find_program_address(&[GEM_ACCOUNT_CONST.as_ref()], program_id);
    if gem_pubkey != *gem_account_info.key {
        Err(InglError::KeyPairMismatch.utilize("gem_account_info"))?
    }

    // check feed owner
    if *btc_feed_account_info.key != Pubkey::from_str(BTC_FEED_PUBLIC_KEY).unwrap() {
        Err(InglError::KeyPairMismatch.utilize("btc_history_account_info_owner"))?
    }
    if *sol_feed_account_info.key != Pubkey::from_str(SOL_FEED_PUBLIC_KEY).unwrap() {
        Err(InglError::KeyPairMismatch.utilize("sol_price_account_info_owner"))?
    }
    if *eth_feed_account_info.key != Pubkey::from_str(ETH_FEED_PUBLIC_KEY).unwrap() {
        Err(InglError::KeyPairMismatch.utilize("eth_price_account_info_owner"))?
    }
    if *bnb_feed_account_info.key != Pubkey::from_str(BNB_FEED_PUBLIC_KEY).unwrap() {
        Err(InglError::KeyPairMismatch.utilize("bnb_price_account_info_owner"))?
    }

    invoke_signed(
        &spl_token::instruction::thaw_account(
            &spl_token::id(),
            associated_token_account_info.key,
            mint_account_info.key,
            freeze_authority_account_info.key,
            &[],
        )?,
        &[
            associated_token_account_info.clone(),
            mint_account_info.clone(),
            freeze_authority_account_info.clone(),
        ],
        &[&[INGL_MINT_AUTHORITY_KEY.as_ref(), &[mint_authority_bump]]],
    )?;

    let mut gem_data: GemAccountV0_0_1 = try_from_slice_unchecked(&gem_account_info.data.borrow())?;

    let btc_history = AggregatorHistoryBuffer::new(btc_feed_account_info)?;
    let AggregatorHistoryRow {
        value: btc_value,
        timestamp: _,
    } = btc_history
        .lower_bound(gem_data.future_price_time.unwrap() as i64)
        .unwrap();
    let btc_price = btc_value.mantissa * 10.pow(btc_value.scale) as i128;

    let sol_history = AggregatorHistoryBuffer::new(sol_feed_account_info)?;
    let AggregatorHistoryRow {
        value: sol_value,
        timestamp: _,
    } = sol_history
        .lower_bound(gem_data.future_price_time.unwrap() as i64)
        .unwrap();
    let sol_price = sol_value.mantissa * 10.pow(sol_value.scale) as i128;

    let eth_history = AggregatorHistoryBuffer::new(eth_feed_account_info)?;
    let AggregatorHistoryRow {
        value: eth_value,
        timestamp: _,
    } = eth_history
        .lower_bound(gem_data.future_price_time.unwrap() as i64)
        .unwrap();
    let eth_price = eth_value.mantissa * 10.pow(eth_value.scale) as i128;

    let bnb_history = AggregatorHistoryBuffer::new(bnb_feed_account_info)?;
    let AggregatorHistoryRow {
        value: bnb_value,
        timestamp: _,
    } = bnb_history
        .lower_bound(gem_data.future_price_time.unwrap() as i64)
        .unwrap();
    let bnb_price = bnb_value.mantissa * 10.pow(bnb_value.scale) as i128;

    let mut string_to_hash = btc_price.to_string();
    string_to_hash.push_str(sol_price.to_string().as_ref() as &str);
    string_to_hash.push_str(eth_price.to_string().as_ref() as &str);
    string_to_hash.push_str(bnb_price.to_string().as_ref() as &str);
    let rarity_hash_string = hash(string_to_hash.as_bytes());
    let rarity_hash_bytes = rarity_hash_string.to_bytes();

    let mut byte_product: u128 = 1;
    for byte in rarity_hash_bytes {
        byte_product = byte_product * byte as u128;
    }

    let match_value = byte_product * 9999 / 255.pow(rarity_hash_bytes.len()) as u128;
    // gem_data.rarity = gem_data.class
    gem_data.serialize(&mut &mut gem_account_info.data.borrow_mut()[..])?;
    Ok(())
}
