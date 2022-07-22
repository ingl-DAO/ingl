from borsh_construct import *
from solana.publickey import PublicKey
import json
from solana.keypair import Keypair
class Constants:
    INGL_NFT_COLLECTION_KEY = "ingl_nft_collection_newer"
    INGL_MINT_AUTHORITY_KEY = "mint_authority"
    INGL_MINTING_POOL_KEY = "minting_pool"
    COLLECTION_HOLDER_KEY = "collection_holder"
    INGL_PROGRAM_ID = PublicKey("8ucRh4mMLWijjaPo8Hk94qBsvjcHsd1scA7h32ehsa5j")
    GLOBAL_GEM_KEY = "global_gem_account"
    GEM_ACCOUNT_CONST = "gem_account"

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