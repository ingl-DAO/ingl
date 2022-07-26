import base64
import solana
from solana.publickey import PublicKey
from solana import system_program
from solana.transaction import *
from spl.token import constants
from spl.token import instructions as assoc_instructions
from instruction import *
from state import rpc_url, Constants as ingl_constants
from solana.rpc.async_api import AsyncClient
from rich import print

async def create_collection(payer_keypair: Keypair, client: AsyncClient) -> String:
    mint_pubkey, _mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_NFT_COLLECTION_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    collection_holder_pubkey, _collection_holder_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COLLECTION_HOLDER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(collection_holder_pubkey, mint_pubkey)
    metaplex_program_id = PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    metadata_pda, _metadata_pda_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_pubkey)], metaplex_program_id)
    master_edition_pda, _master_edition_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_pubkey), b"edition"], metaplex_program_id)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    council_mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    council_mint_pubkey, _collection_mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    print("Collection Key: ", mint_pubkey)
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    collection_holder_meta = AccountMeta(collection_holder_pubkey, False, True) #This might be the cause of a Writable escalated permission error.
    mint_account_meta = AccountMeta(mint_pubkey, False, True)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, False)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    spl_program_meta = AccountMeta(constants.TOKEN_PROGRAM_ID, False, False)
    sysvar_rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    token_metadata_meta = AccountMeta(metadata_pda, False, True)
    metadata_program_id = AccountMeta(metaplex_program_id, False, False)
    associated_program_meta = AccountMeta(constants.ASSOCIATED_TOKEN_PROGRAM_ID, False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    edition_meta = AccountMeta(master_edition_pda, False, True)
    council_mint_account_meta = AccountMeta(council_mint_pubkey, False, True)
    council_mint_authority_meta = AccountMeta(council_mint_authority_pubkey, False, False)

    accounts = [
        payer_account_meta,
        collection_holder_meta,
        mint_account_meta,
        mint_authority_meta,
        mint_associated_meta,
        spl_program_meta,
        sysvar_rent_account_meta,
        system_program_meta,
        token_metadata_meta,
        global_gem_meta,
        edition_meta,
        council_mint_account_meta,
        council_mint_authority_meta,

        system_program_meta,
        system_program_meta,
        spl_program_meta,
        associated_program_meta,
        spl_program_meta,
        metadata_program_id,
        metadata_program_id,
    ]
    data = build_instruction(InstructionEnum.enum.MintNewCollection())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def mint_nft(payer_keypair: Keypair, mint_keypair: Keypair, mint_class: ClassEnum.enum, client: AsyncClient) -> String:
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    collection_mint_pubkey, _collection_mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_NFT_COLLECTION_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    minting_pool_pubkey, _minting_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINTING_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_keypair.public_key)
    metaplex_program_id = PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    metadata_pda, _metadata_pda_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_keypair.public_key)], metaplex_program_id)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    collection_master_edition_pda, _master_edition_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(collection_mint_pubkey), b"edition"], metaplex_program_id)
    mint_edition_pda, _mint_edition_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_keypair.public_key), b"edition"], metaplex_program_id)
    collection_account_pda, _collection_account_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(collection_mint_pubkey)], metaplex_program_id)
    gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_keypair.public_key)], ingl_constants.INGL_PROGRAM_ID)

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    mint_account_meta = AccountMeta(mint_keypair.public_key, True, True)
    minting_pool_meta = AccountMeta(minting_pool_pubkey, False, True)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, True)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    spl_program_meta = AccountMeta(constants.TOKEN_PROGRAM_ID, False, False)
    sysvar_rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    token_metadata_meta = AccountMeta(metadata_pda, False, True)
    metadata_program_id = AccountMeta(metaplex_program_id, False, False)
    associated_program_meta = AccountMeta(constants.ASSOCIATED_TOKEN_PROGRAM_ID, False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    gem_account_meta = AccountMeta(gem_account_pubkey, False, True)
    collection_master_edition_meta = AccountMeta(collection_master_edition_pda, False, True)
    mint_edition_meta = AccountMeta(mint_edition_pda, False, True)
    collection_mint_meta = AccountMeta(collection_mint_pubkey, False, True)
    collection_account_meta = AccountMeta(collection_account_pda, False, True)


    accounts = [
        payer_account_meta,
        mint_account_meta,
        mint_authority_meta,
        mint_associated_meta,
        spl_program_meta,
        sysvar_rent_account_meta,
        system_program_meta,
        token_metadata_meta,
        minting_pool_meta,
        global_gem_meta,
        gem_account_meta,
        collection_master_edition_meta,
        mint_edition_meta,
        collection_mint_meta,
        collection_account_meta,

        system_program_meta,
        spl_program_meta,
        system_program_meta,
        spl_program_meta,
        associated_program_meta,
        spl_program_meta,
        metadata_program_id,
        metadata_program_id,
        spl_program_meta,
        metadata_program_id,
    ]
    # print(accounts)
    instruction_data = build_instruction(InstructionEnum.enum.MintNft(), mint_class)
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try: 
        t_dets = await client.send_transaction(transaction, payer_keypair, mint_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def allocate_sol(payer_keypair: Keypair, mint_pubkey: PublicKey, client: AsyncClient) -> String:
    minting_pool_pubkey, _minting_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINTING_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    pd_pool_pubkey, _pd_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.PD_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_pubkey)

    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    mint_account_meta = AccountMeta(mint_pubkey, False, True)
    gem_account_meta = AccountMeta(gem_account_pubkey, False, True)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    pd_pool_meta = AccountMeta(pd_pool_pubkey, False, True)
    minting_pool_meta = AccountMeta(minting_pool_pubkey, False, True)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)


    accounts = [
        payer_account_meta,
        mint_account_meta,
        gem_account_meta,
        mint_associated_meta,
        global_gem_meta,
        pd_pool_meta,
        minting_pool_meta,
        # sysvar_clock_meta,

        system_program_meta
    ]

    # print(accounts)
    instruction_data = build_instruction(InstructionEnum.enum.AllocateNFT())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def deallocate_sol(payer_keypair: Keypair, mint_pubkey: PublicKey, client: AsyncClient) -> String:
    minting_pool_pubkey, _minting_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINTING_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    pd_pool_pubkey, _pd_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.PD_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_pubkey)

    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    mint_account_meta = AccountMeta(mint_pubkey, False, True)
    gem_account_meta = AccountMeta(gem_account_pubkey, False, True)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    pd_pool_meta = AccountMeta(pd_pool_pubkey, False, True)
    minting_pool_meta = AccountMeta(minting_pool_pubkey, False, True)
    # sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)


    accounts = [
        payer_account_meta,
        mint_account_meta,
        gem_account_meta,
        mint_associated_meta,
        global_gem_meta,
        pd_pool_meta,
        minting_pool_meta,
        # sysvar_clock_meta,

        system_program_meta
    ]

    # print(accounts)
    instruction_data = build_instruction(InstructionEnum.enum.DeAllocateNFT())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")



async def register_validator_id(payer_keypair: Keypair, validator_pubkey: PublicKey, client: AsyncClient) -> String:
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)

    dupkey, dup_bump = PublicKey.find_program_address([ingl_constants.DUPKEYBYTES, bytes(validator_pubkey)], ingl_constants.INGL_PROGRAM_ID);

    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, True)
    validator_meta = AccountMeta(validator_pubkey, False, False)
    dup_meta = AccountMeta(dupkey, False, True)

    accounts = [
        payer_account_meta,
        global_gem_meta,
        mint_authority_meta,
        validator_meta,
        dup_meta,

        system_program_meta,
        system_program_meta,
    ]

    instruction_data = build_instruction(InstructionEnum.enum.RegisterValidatorId())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")


async def create_validator_proposal(payer_keypair: Keypair, proposal_numeration: int, client: AsyncClient) -> String:
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)
    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, True)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    print(f"Proposal_id: {proposal_pubkey}")
    accounts = [
        payer_account_meta,
        global_gem_meta,
        proposal_meta,

        system_program_meta,
    ]

    instruction_data = build_instruction(InstructionEnum.enum.CreateValidatorSelectionProposal())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")


async def vote_validator_proposal(payer_keypair: Keypair, proposal_numeration: int, mint_pubkeys: List[PublicKey], val_index:int, client: AsyncClient) -> String:
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)


    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, True)

    accounts = [
        payer_account_meta,
        proposal_meta
        ]

    for mint in mint_pubkeys:
        gem_account_pubkey, _ = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint)], ingl_constants.INGL_PROGRAM_ID)
        accounts.append(AccountMeta(mint, False, False))
        accounts.append(AccountMeta(assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint), False, False))
        accounts.append(AccountMeta(gem_account_pubkey, False, True) )




    instruction_data = build_instruction(InstructionEnum.enum.VoteValidatorProposal(num_nfts = len(mint_pubkeys), validator_index = val_index))
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")


async def finalize_proposal(payer_keypair: Keypair, client: AsyncClient) -> String:
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    
    data = await client.get_account_info(global_gem_pubkey)
    global_gems = GlobalGems.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0]))
    proposal_numeration = global_gems.proposal_numeration - 1
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)

    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, True)

    accounts = [
        payer_account_meta,
        proposal_meta,
        global_gem_meta,
    ]

    instruction_data = build_instruction(InstructionEnum.enum.FinalizeProposal())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def delegate_nft(payer_keypair: Keypair, mint_pubkey: PublicKey, expected_vote_pubkey: PublicKey, client: AsyncClient) -> String:
    gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_pubkey)
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)

    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    mint_account_meta = AccountMeta(mint_pubkey, False, True)
    gem_account_meta = AccountMeta(gem_account_pubkey, False, True)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    
    vote_account_meta = AccountMeta(expected_vote_pubkey, False, True)
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    stake_config_program_meta = AccountMeta(ingl_constants.STAKE_CONFIG_PROGRAM_ID, False, False)


    accounts = [
        payer_account_meta,
        vote_account_meta,
        ingl_vote_data_account_meta,
        mint_account_meta,
        gem_account_meta,
        mint_associated_meta,
        global_gem_meta,
        sysvar_clock_meta,
        stake_config_program_meta,
    ]

    # print(accounts)
    instruction_data = build_instruction(InstructionEnum.enum.DelegateNFT())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def undelegate_nft(payer_keypair: Keypair, mint_pubkey: PublicKey, expected_vote_pubkey: PublicKey, client: AsyncClient) -> String: #TODO: Need to include the 3 new accounts: Authorized_withdrawer, validator_info, and the system program in this instruction, without which instruction will consistently fail
    pd_pool_pubkey, _pd_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.PD_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_pubkey)
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    authorized_withdrawer_key, _authorized_withdrawer_bump = PublicKey.find_program_address([bytes(ingl_constants.AUTHORIZED_WITHDRAWER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    
    data = await client.get_account_info(expected_vote_data_pubkey)
    validator_id = PublicKey(InglVoteAccountData.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0])).validator_id)

    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    mint_account_meta = AccountMeta(mint_pubkey, False, True)
    gem_account_meta = AccountMeta(gem_account_pubkey, False, True)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    pd_pool_meta = AccountMeta(pd_pool_pubkey, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    stake_program_meta  = AccountMeta(ingl_constants.STAKE_PROGRAM_ID, False, False)
    
    vote_account_meta = AccountMeta(expected_vote_pubkey, False, True)
    authorized_withdrawer_meta = AccountMeta(authorized_withdrawer_key, False, True)
    validator_account_meta =  AccountMeta(validator_id, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)


    accounts = [
        payer_account_meta,
        pd_pool_meta,
        vote_account_meta,
        ingl_vote_data_account_meta,
        mint_account_meta,
        gem_account_meta,
        mint_associated_meta,
        global_gem_meta,
        validator_account_meta,
        system_program_meta,
        authorized_withdrawer_meta,

        system_program_meta,
        stake_program_meta,
    ]

    # print(accounts)
    instruction_data = build_instruction(InstructionEnum.enum.UnDelegateNFT())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")


async def create_vote_account(validator_keypair: Keypair, proposal_numeration: int, client: AsyncClient) -> String:
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    council_mint_pubkey, _collection_mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    expected_vote_pubkey, _expected_vote_pubkey_nonce = PublicKey.find_program_address([bytes(ingl_constants.VOTE_ACCOUNT_KEY, "UTF-8"), (proposal_numeration).to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(expected_vote_pubkey, council_mint_pubkey)
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    expected_stake_key, _expected_stake_bump = PublicKey.find_program_address([bytes(ingl_constants.STAKE_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    pd_pool_pubkey, _pd_pool_bump = PublicKey.find_program_address([bytes(ingl_constants.PD_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    
    print(f"Vote_Account: {expected_vote_pubkey}")

    rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    stake_config_meta = AccountMeta(ingl_constants.STAKE_CONFIG_PROGRAM_ID, False, False)
    sysvar_stake_history_meta = AccountMeta(solana.sysvar.SYSVAR_STAKE_HISTORY_PUBKEY, False, False)
    validator_meta = AccountMeta(validator_keypair.public_key, True, True)
    vote_account_meta = AccountMeta(expected_vote_pubkey, False, True)
    sys_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    vote_program_meta = AccountMeta(ingl_constants.VOTE_PROGRAM_ID, False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, True)
    mint_account_meta = AccountMeta(council_mint_pubkey, False, True)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, False)
    mint_assoc_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    spl_program_meta = AccountMeta(constants.TOKEN_PROGRAM_ID, False, False)
    associated_program_meta = AccountMeta(constants.ASSOCIATED_TOKEN_PROGRAM_ID, False, False)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    stake_account_meta = AccountMeta(expected_stake_key, False, True)
    pd_pool_meta = AccountMeta(pd_pool_pubkey, False, True)
    stake_program_meta = AccountMeta(ingl_constants.STAKE_PROGRAM_ID, False, False)


    accounts = [
        validator_meta,
        vote_account_meta,
        rent_account_meta,
        sysvar_clock_meta,
        global_gem_meta,
        proposal_meta,
        mint_assoc_meta,
        mint_account_meta,
        mint_authority_meta,
        sys_program_meta,
        spl_program_meta,
        ingl_vote_data_account_meta,
        stake_account_meta,
        pd_pool_meta,
        sysvar_stake_history_meta,
        stake_config_meta,

        
        associated_program_meta,
        spl_program_meta,
        vote_program_meta,
        vote_program_meta,
        sys_program_meta,
        stake_program_meta,
    ]

    data = InstructionEnum.build(InstructionEnum.enum.CreateVoteAccount())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try: 
        t_dets = await client.send_transaction(transaction, validator_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def close_proposal(payer_keypair: Keypair, proposal_numeration: int, client: AsyncClient) -> String:
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    expected_vote_pubkey, _expected_vote_pubkey_nonce = PublicKey.find_program_address([bytes(ingl_constants.VOTE_ACCOUNT_KEY, "UTF-8"), (proposal_numeration).to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    
    data = await client.get_account_info(global_gem_pubkey)
    global_gems = GlobalGems.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0]))
    proposal_numeration = global_gems.proposal_numeration - 1
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)


    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, False)

    accounts = [
        payer_account_meta,
        global_gem_meta,
        ingl_vote_data_account_meta,
        proposal_meta,
    ]

    data = InstructionEnum.build(InstructionEnum.enum.CloseProposal())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def init_rebalance(payer_keypair: Keypair, vote_account_pubkey: PublicKey, client: AsyncClient) -> String:
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    expected_vote_pubkey = vote_account_pubkey
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    expected_stake_key, _expected_stake_bump = PublicKey.find_program_address([bytes(ingl_constants.STAKE_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    t_stake_key, _t_stake_bump = PublicKey.find_program_address([bytes(ingl_constants.T_STAKE_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    t_withdraw_key, _t_withdraw_bump = PublicKey.find_program_address([bytes(ingl_constants.T_WITHDRAW_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    pd_pool_pubkey, _pd_pool_bump = PublicKey.find_program_address([bytes(ingl_constants.PD_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    data = await client.get_account_info(expected_vote_data_pubkey)
    validator_id = PublicKey(InglVoteAccountData.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0])).validator_id)
    print(f"Validator_Id: {validator_id}")

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    validator_meta = AccountMeta(validator_id, True, True)
    vote_account_meta = AccountMeta(expected_vote_pubkey, False, True)
    sys_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    stake_account_meta = AccountMeta(expected_stake_key, False, True)
    t_stake_meta = AccountMeta(t_stake_key, False, True)
    t_withdraw_meta = AccountMeta(t_withdraw_key, False, True)
    pd_pool_meta = AccountMeta(pd_pool_pubkey, False, True)
    stake_program_meta = AccountMeta(ingl_constants.STAKE_PROGRAM_ID, False, False)

    accounts = [
        payer_account_meta,
        vote_account_meta,
        validator_meta,
        t_stake_meta,
        pd_pool_meta,
        global_gem_meta,
        ingl_vote_data_account_meta,
        sysvar_clock_meta,
        rent_account_meta,
        stake_account_meta,
        t_withdraw_meta,

        
        sys_program_meta,
        stake_program_meta,
        sys_program_meta,
        sys_program_meta,
        stake_program_meta,
        stake_program_meta,
    ]
    print(accounts)
    data = InstructionEnum.build(InstructionEnum.enum.InitRebalance())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def finalize_rebalance(payer_keypair: Keypair, vote_account_pubkey: PublicKey, client: AsyncClient) -> String:
    expected_vote_pubkey = vote_account_pubkey
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    expected_stake_key, _expected_stake_bump = PublicKey.find_program_address([bytes(ingl_constants.STAKE_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    t_stake_key, _t_stake_bump = PublicKey.find_program_address([bytes(ingl_constants.T_STAKE_ACCOUNT_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    t_withdraw_key, _t_withdraw_bump = PublicKey.find_program_address([bytes(ingl_constants.T_WITHDRAW_KEY, 'UTF-8'), bytes(expected_vote_pubkey)], ingl_constants.INGL_PROGRAM_ID)
    pd_pool_pubkey, _pd_pool_bump = PublicKey.find_program_address([bytes(ingl_constants.PD_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    data = await client.get_account_info(expected_vote_data_pubkey)
    validator_id = PublicKey(InglVoteAccountData.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0])).validator_id)
    print(f"Validator_Id: {validator_id}")

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    validator_meta = AccountMeta(validator_id, True, True)
    vote_account_meta = AccountMeta(expected_vote_pubkey, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    stake_account_meta = AccountMeta(expected_stake_key, False, True)
    t_stake_meta = AccountMeta(t_stake_key, False, True)
    t_withdraw_meta = AccountMeta(t_withdraw_key, False, True)
    pd_pool_meta = AccountMeta(pd_pool_pubkey, False, True)
    stake_program_meta = AccountMeta(ingl_constants.STAKE_PROGRAM_ID, False, False)
    sysvar_stake_history_meta = AccountMeta(solana.sysvar.SYSVAR_STAKE_HISTORY_PUBKEY, False, False)

    accounts = [
        payer_account_meta,
        vote_account_meta,
        validator_meta,
        t_stake_meta,
        pd_pool_meta,
        ingl_vote_data_account_meta,
        sysvar_clock_meta,
        stake_account_meta,
        t_withdraw_meta,
        sysvar_stake_history_meta,
        
        
        stake_program_meta,
        stake_program_meta,
        stake_program_meta,
    ]

    data = InstructionEnum.build(InstructionEnum.enum.FinalizeRebalance())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def process_rewards(payer_keypair: Keypair, vote_account_id: PublicKey, client: AsyncClient) -> String:
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(vote_account_id)], ingl_constants.INGL_PROGRAM_ID)
    data = await client.get_account_info(expected_vote_data_pubkey)
    validator_id = PublicKey(InglVoteAccountData.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0])).validator_id)
    authorized_withdrawer_key, _authorized_withdrawer_bump = PublicKey.find_program_address([bytes(ingl_constants.AUTHORIZED_WITHDRAWER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    treasury_key, _treasury_bump = PublicKey.find_program_address([bytes(ingl_constants.TREASURY_ACCOUNT_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    print(f"Validator_Id: {validator_id}")

    treasury_meta = AccountMeta(treasury_key, False, True)
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    validator_meta = AccountMeta(validator_id, False, True)
    vote_account_meta = AccountMeta(vote_account_id, False, True)
    sys_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    vote_program_meta = AccountMeta(ingl_constants.VOTE_PROGRAM_ID, False, False)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    authorized_withdrawer_meta = AccountMeta(authorized_withdrawer_key, False, True)


    accounts = [
        payer_account_meta,
        validator_meta,
        vote_account_meta,
        ingl_vote_data_account_meta,
        authorized_withdrawer_meta,
        mint_authority_meta,
        treasury_meta,
        
        
        vote_program_meta,
        sys_program_meta,
        sys_program_meta,
        sys_program_meta,
    ]
    # print(accounts)
    data = InstructionEnum.build(InstructionEnum.enum.ProcessRewards())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def nft_withdraw(payer_keypair: Keypair, mints: List[PublicKey], vote_account_id: PublicKey, client: AsyncClient) -> String:
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(vote_account_id)], ingl_constants.INGL_PROGRAM_ID)
    data = await client.get_account_info(expected_vote_data_pubkey)
    validator_id = PublicKey(InglVoteAccountData.parse(base64.urlsafe_b64decode(data['result']['value']['data'][0])).validator_id)
    authorized_withdrawer_key, _authorized_withdrawer_bump = PublicKey.find_program_address([bytes(ingl_constants.AUTHORIZED_WITHDRAWER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    validator_meta = AccountMeta(validator_id, False, True)
    vote_account_meta = AccountMeta(vote_account_id, False, True)
    sys_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    authorized_withdrawer_meta = AccountMeta(authorized_withdrawer_key, False, True)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)

    accounts = [
        payer_account_meta,
        vote_account_meta,
        validator_meta,
        ingl_vote_data_account_meta,
        authorized_withdrawer_meta,
        
    ]

    for mint_pubkey in mints:
        mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_pubkey)
        accounts.append(AccountMeta(mint_associated_account_pubkey, False, False))
        accounts.append(AccountMeta(mint_pubkey, False, False))
        gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_pubkey)], ingl_constants.INGL_PROGRAM_ID)
        accounts.append(AccountMeta(gem_account_pubkey, False, True))




    accounts.append(sys_program_meta)
    # print(accounts)
    data = InstructionEnum.build(InstructionEnum.enum.NFTWithdraw(len(mints)))
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")

async def inject_testing_data(payer_keypair: Keypair, mints: List[PublicKey], vote_account_id: PublicKey, client: AsyncClient) -> String:
    expected_vote_data_pubkey, _expected_vote_data_bump = PublicKey.find_program_address([bytes(ingl_constants.VOTE_DATA_ACCOUNT_KEY, 'UTF-8'), bytes(vote_account_id)], ingl_constants.INGL_PROGRAM_ID)
    authorized_withdrawer_key, _authorized_withdrawer_bump = PublicKey.find_program_address([bytes(ingl_constants.AUTHORIZED_WITHDRAWER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    vote_account_meta = AccountMeta(vote_account_id, False, True)
    sys_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    ingl_vote_data_account_meta = AccountMeta(expected_vote_data_pubkey, False, True)
    authorized_withdrawer_meta = AccountMeta(authorized_withdrawer_key, False, True)

    accounts = [
        payer_account_meta,
        vote_account_meta,
        ingl_vote_data_account_meta,
        authorized_withdrawer_meta,
        
    ]

    for mint_pubkey in mints:
        accounts.append(AccountMeta(mint_pubkey, False, False))
        gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_pubkey)], ingl_constants.INGL_PROGRAM_ID)
        accounts.append(AccountMeta(gem_account_pubkey, False, True))




    accounts.append(sys_program_meta)
    # print(accounts)
    data = InstructionEnum.build(InstructionEnum.enum.InjectTestingData(len(mints)))
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    try:
        t_dets = await client.send_transaction(transaction, payer_keypair)
        await client.confirm_transaction(tx_sig = t_dets['result'], commitment= "finalized", sleep_seconds = 0.4, last_valid_block_height = None)
        await client.close()
        return f"Transaction Id: [link=https://explorer.solana.com/tx/{t_dets['result']+rpc_url.get_explorer_suffix()}]{t_dets['result']}[/link]"
    except Exception as e:
        await client.close()
        return(f"Error: {e}")