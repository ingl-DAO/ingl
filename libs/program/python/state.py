from borsh_construct import *
from solana.publickey import PublicKey
import json
from solana.keypair import Keypair
import base58
class Constants:
    INGL_NFT_COLLECTION_KEY = "ingl_nft_collection_newer"
    INGL_MINT_AUTHORITY_KEY = "mint_authority"
    INGL_MINTING_POOL_KEY = "minting_pool"
    COLLECTION_HOLDER_KEY = "collection_holder"
    INGL_PROGRAM_ID = PublicKey("9dSZN479QxPdogZTwjaBRiTfFAvhq3kNF1GEwUWW7es6")
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
    VOTE_PROGRAM_ID = PublicKey("Vote111111111111111111111111111111111111111")
    T_STAKE_ACCOUNT_KEY = "Temporary_stake_account_key"
    T_WITHDRAW_KEY = "Temporary_withdraw"
    DUPKEYBYTES = b"dupkey"

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
    "validation_phrase"/ U32,
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

VoteRewards = CStruct(
    "validation_phrase" / U32,
    "epoch_number" / U64,
    "total_reward" / U64,
    "total_stake" / U64,
)

InglVoteAccountData = CStruct(
    "validation_phrase" / U32,
    "total_delegated" / U64,
    "last_withdraw_epoch" / U64,
    "dealloced" / U64,
    "pending_validator_rewards" / Option(U64), # Field is also used to check if there is an ongoing rebalancing or not.
    "validator_id" / U8[32], #To Reconsider.
    "last_total_staked" / U64,
    "is_t_stake_initialized" / Bool,
    "pending_delegation_total" / U64,
    "vote_rewards" / Vec(VoteRewards),
)

def private_key_from_json(filepath):
    return base58.b58encode(keypair_from_json(filepath).secret_key).decode()