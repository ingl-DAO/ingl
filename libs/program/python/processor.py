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
    metaplex_program_id = PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    metadata_pda, _metadata_pda_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_pubkey)], metaplex_program_id)
    master_edition_pda, _master_edition_bump = PublicKey.find_program_address([b"metadata", bytes(metaplex_program_id), bytes(mint_pubkey), b"edition"], metaplex_program_id)
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    council_mint_pubkey, _collection_mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)

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
    council_mint_authority_meta = AccountMeta(mint_authority_pubkey, False, False)

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
    # sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
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
        # sysvar_clock_meta,
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
    instruction_data = build_instruction(InstructionEnum.enum.MintNft(), mint_class)
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
    instruction_data = build_instruction(InstructionEnum.enum.AllocateSol())
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
    instruction_data = build_instruction(InstructionEnum.enum.DeAllocateSol())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    return client.send_transaction(transaction, payer_keypair)



def register_validator_id(payer_keypair, client):
    
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)


    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)

    accounts = [
        payer_account_meta,
        global_gem_meta,
    ]

    instruction_data = build_instruction(InstructionEnum.enum.RegisterValidatorId())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    return client.send_transaction(transaction, payer_keypair)


def create_validator_proposal(payer_keypair, proposal_numeration, client):
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)


    
    payer_account_meta = AccountMeta(payer_keypair.public_key, True, True)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, True)
    system_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)

    accounts = [
        payer_account_meta,
        global_gem_meta,
        proposal_meta,

        system_program_meta,
    ]

    instruction_data = build_instruction(InstructionEnum.enum.CreateValidatorSelectionProposal())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, instruction_data))
    return client.send_transaction(transaction, payer_keypair)


def vote_validator_proposal(payer_keypair, proposal_numeration, mint_pubkeys, val_index, client):
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
    return client.send_transaction(transaction, payer_keypair)


def finalize_proposal(payer_keypair, proposal_numeration, client):
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
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
    return client.send_transaction(transaction, payer_keypair)



def create_vote_account(validator_keypair, proposal_numeration, client):
    global_gem_pubkey, _global_gem_bump = PublicKey.find_program_address([bytes(ingl_constants.GLOBAL_GEM_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    proposal_pubkey, _proposal_bump = PublicKey.find_program_address([bytes(ingl_constants.PROPOSAL_KEY, 'UTF-8'), proposal_numeration.to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)
    mint_authority_pubkey, _mint_authority_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_AUTHORITY_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    council_mint_pubkey, _collection_mint_pubkey_bump = PublicKey.find_program_address([bytes(ingl_constants.COUNCIL_MINT_KEY, 'UTF-8')], ingl_constants.INGL_PROGRAM_ID)
    expected_vote_pubkey, _expected_vote_pubkey_nonce = PublicKey.find_program_address([bytes(ingl_constants.VOTE_ACCOUNT_KEY, "UTF-8"), (proposal_numeration).to_bytes(4,"big")], ingl_constants.INGL_PROGRAM_ID)
    mint_associated_account_pubkey = assoc_instructions.get_associated_token_address(expected_vote_pubkey, council_mint_pubkey)
    


    rent_account_meta = AccountMeta(solana.sysvar.SYSVAR_RENT_PUBKEY, False, False)
    sysvar_clock_meta = AccountMeta(solana.sysvar.SYSVAR_CLOCK_PUBKEY, False, False)
    validator_meta = AccountMeta(validator_keypair.public_key, True, True)
    vote_account_meta = AccountMeta(expected_vote_pubkey, False, True)
    sys_program_meta = AccountMeta(system_program.SYS_PROGRAM_ID, False, False)
    vote_program_meta = AccountMeta(PublicKey("Vote111111111111111111111111111111111111111"), False, False)
    global_gem_meta = AccountMeta(global_gem_pubkey, False, True)
    proposal_meta = AccountMeta(proposal_pubkey, False, True)
    mint_account_meta = AccountMeta(council_mint_pubkey, False, True)
    mint_authority_meta = AccountMeta(mint_authority_pubkey, False, False)
    mint_assoc_meta = AccountMeta(mint_associated_account_pubkey, False, True)
    spl_program_meta = AccountMeta(constants.TOKEN_PROGRAM_ID, False, False)
    associated_program_meta = AccountMeta(constants.ASSOCIATED_TOKEN_PROGRAM_ID, False, False)

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

        
        associated_program_meta,
        spl_program_meta,
        sys_program_meta,
        vote_program_meta
    ]

    data = InstructionEnum.build(InstructionEnum.enum.CreateVoteAccount())
    transaction = Transaction()
    transaction.add(TransactionInstruction(accounts, ingl_constants.INGL_PROGRAM_ID, data))
    return client.send_transaction(transaction, validator_keypair)
