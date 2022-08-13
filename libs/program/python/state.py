from borsh_construct import *
from solana.publickey import PublicKey
import json
from solana.keypair import Keypair
class Constants:
    INGL_NFT_COLLECTION_KEY = "ingl_nft_collection_newer"
    INGL_MINT_AUTHORITY_KEY = "mint_authority"
    INGL_MINTING_POOL_KEY = "minting_pool"
    COLLECTION_HOLDER_KEY = "collection_holder"
    INGL_PROGRAM_ID = PublicKey("4ATadzrRQHetgSeByytfJRuVwWtXFPwKUySdb3279AGe")
    STAKE_PROGRAM_ID = PublicKey("Stake11111111111111111111111111111111111111")
    GLOBAL_GEM_KEY = "global_gem_account"
    GEM_ACCOUNT_CONST = "gem_account"
    PD_POOL_KEY = "pd_pool"
    PROPOSAL_KEY = "ingl_proposals"
    COUNCIL_MINT_KEY = "council_mint"
    COUNCIL_MINT_AUTHORITY_KEY = "council_mint_authority"
    AUTHORIZED_WITHDRAWER_KEY = "InglAuthorizedWithdrawer"
    VOTE_ACCOUNT_KEY = "InglVote"
    VOTE_DATA_ACCOUNT_KEY = "InglVoteData"
    STAKE_ACCOUNT_KEY = "staking_account_key"   
    TREASURY_ACCOUNT_KEY = "Treasury_account_key"
    STAKE_CONFIG_PROGRAM_ID = PublicKey("StakeConfig11111111111111111111111111111111")

    VALIDATOR_ID_SHARE = 15
    TREASURY_SHARE = 13
    TEAM_SHARE = 12
    NFTS_SHARE = 60

ClassEnum = Enum(
    "Ruby",
    "Diamond",
    "Sapphire",
    "Emerald",
    "Serendibite",
    "Benitoite",

    enum_name = "ClassEnum",
)

def keypair_from_json(filepath):
    keypair = Keypair.from_secret_key(json.load(open(filepath)))
    return keypair

GlobalGems = CStruct(
    "validation_phrase" / U32,
    "counter" / U32,
    "total_raised" / U64,
    "pd_pool_total" / U64,
    "delegated_total" / U64,
    "dealloced_total" / U64,
    "is_proposal_ongoing" / Bool,
    "proposal_numeration" / U32,
    "pending_delegation_total" / U64,
    "validator_list" / Vec(U8[32])
)

ProposalValidator = CStruct(
    "validation_phrase" / U32,
    "validator_ids" / Vec(U8[32]),
    "date_created" / U32,
    "date_finalized" / Option(U32),
    "votes" / Vec(U32),
    "winner" / Option(U8[32]),
)