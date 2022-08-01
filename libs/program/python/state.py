from borsh_construct import *
from solana.publickey import PublicKey
import json
from solana.keypair import Keypair
class Constants:
    INGL_NFT_COLLECTION_KEY = "ingl_nft_collection_newer"
    INGL_MINT_AUTHORITY_KEY = "mint_authority"
    INGL_MINTING_POOL_KEY = "minting_pool"
    COLLECTION_HOLDER_KEY = "collection_holder"
    INGL_PROGRAM_ID = PublicKey("4au6MZAQnjGYnMpGM5zKKQbDdTDuMgtkvWryHQV7mryy")
    GLOBAL_GEM_KEY = "global_gem_account"
    GEM_ACCOUNT_CONST = "gem_account"
    PD_POOL_KEY = "pd_pool"
    PROPOSAL_KEY = "ingl_proposals"
    COUNCIL_MINT_KEY = "council_mint"
    COUNCIL_MINT_AUTHORITY_KEY = "council_mint_authority"
    AUTHORIZED_WITHDRAWER_KEY = "InglAuthorizedWithdrawer"
    VOTE_ACCOUNT_KEY = "InglVote"

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