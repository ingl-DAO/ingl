import solana
from solana.publickey import PublicKey
from solana import system_program
from solana.transaction import *
from spl.token import constants
from spl.token import instructions as assoc_instructions
from instruction import *
from state import Constants as ingl_constants

def create_collection(payer_keypair, client):
    mint_pubkey, _mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_NFT_COLLECTION_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    minting_pool_pubkey, _minting_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINTING_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    collection_holder_pubkey, _collection_holder_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COLLECTION_HOLDER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(collection_holder_pubkey, mint_pubkey)
    token_metadata_pubkey = PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    metadata_pda, _metadata_pda_bump = PublicKey.find_program_address([b"metadata", bytes(token_metadata_pubkey), bytes(mint_pubkey)], token_metadata_pubkey)
    master_edition_pda, _master_edition_bump = PublicKey.find_program_address([b"metadata", bytes(token_metadata_pubkey), bytes(mint_pubkey), b"edition"], token_metadata_pubkey)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    collection_holder_meta = AccountMeta(collection_holder_pubkey, False, True) #This might be the cause of a Writable escalated permission error.
    mint_account_meta = AccountMeta(mint_pubkey, False, True)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, False)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    spl_program_meta = AccountMeta(constants.TOKEN_PROGRAM_ID, False, False)
    sysvar_rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    token_metadata_meta = AccountMeta(metadata_pda, False, True)
    metadata_program_id = AccountMeta(token_metadata_pubkey, False, False)
    associated_program_meta = AccountMeta(constants.ASSOCIATED_TOKEN_PROGRAM_ID, False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    edition_meta = AccountMeta(master_edition_pda, False, True)

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

        system_program_meta,
        system_program_meta,
        spl_program_meta,
        associated_program_meta,
        spl_program_meta,
        metadata_program_id,
        metadata_program_id,
    ]
    data = build_instruction("MintNewCollection")
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    return client.send_transaction(transaction, payer_keypair)['result']

def mint_nft(payer_keypair, mint_keypair, mint_class, client):
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    collection_mint_pubkey, _collection_mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_NFT_COLLECTION_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    minting_pool_pubkey, _minting_pool_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.INGL_MINTING_POOL_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    collection_holder_pubkey, _collection_holder_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COLLECTION_HOLDER_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(payer_keypair.public_key, mint_keypair.public_key)
    metaplex_program_id = PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    metadata_pda, _metadata_pda_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_keypair.public_key)], metaplex_program_id)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    master_edition_pda, _master_edition_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(collection_mint_pubkey), b"edition"], metaplex_program_id)
    collection_account_pda, _collection_account_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(collection_mint_pubkey)], metaplex_program_id)
    gem_account_pubkey, _gem_account_bump = PublicKey.find_program_address([bytes(ingl_constants.GEM_ACCOUNT_CONST, 'UTF-8'), bytes(mint_keypair.public_key)], ingl_constants.INGL_PROGRAM_ID)

    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    mint_account_meta = AccountMeta(mint_keypair.public_key, True, True)
    minting_pool_meta = AccountMeta(minting_pool_pubkey, False, True)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, False)
    mint_associated_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    spl_program_meta = AccountMeta(constants.TOKEN_PROGRAM_ID, False, False)
    sysvar_rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    token_metadata_meta = AccountMeta(metadata_pda, False, True)
    metadata_program_id = AccountMeta(metaplex_program_id, False, False)
    associated_program_meta = AccountMeta(constants.ASSOCIATED_TOKEN_PROGRAM_ID, False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    gem_account_meta = AccountMeta(gem_account_pubkey, False, True)
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    edition_meta = AccountMeta(master_edition_pda, False, False)
    collection_mint_meta = AccountMeta(collection_mint_pubkey, False, False)
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
        sysvar_clock_meta,
        edition_meta,
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
    instruction_data = build_instruction("MintNft", mint_class)
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    return client.send_transaction(transaction, payer_keypair, mint_keypair)

def allocate_sol(payer_keypair, mint_pubkey, client):
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
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)


    accounts = [
        payer_account_meta,
        mint_account_meta,
        gem_account_meta,
        mint_associated_meta,
        global_gem_meta,
        pd_pool_meta,
        minting_pool_meta,
        sysvar_clock_meta,

        system_program_meta
    ]

    # print(accounts)
    instruction_data = build_instruction("AllocateSol")
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    return client.send_transaction(transaction, payer_keypair)

def deallocate_sol(payer_keypair, mint_pubkey, client):
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
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)


    accounts = [
        payer_account_meta,
        mint_account_meta,
        gem_account_meta,
        mint_associated_meta,
        global_gem_meta,
        pd_pool_meta,
        minting_pool_meta,
        sysvar_clock_meta,

        system_program_meta
    ]

    # print(accounts)
    instruction_data = build_instruction("DeAllocateSol")
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    return client.send_transaction(transaction, payer_keypair)