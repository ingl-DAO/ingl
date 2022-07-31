from borsh_construct import *
from state import *

InstructionEnum = Enum(
    "MintNft",
    "MintNewCollection",
    "Redeem",
    "ImprintRarity",
    "AllocateSol",
    "DeAllocateSol",
    "CreateVoteAccount",
    "ChangeVoteAccountsValidatorIdentity",
    "DelegateSol",
    "UnDelegateSol",
    "InitRarityImprint",
    "RegisterValidatorId",
    "CreateValidatorSelectionProposal",
    "VoteValidatorProposal" / CStruct("num_nfts"/U8, "validator_index"/ U32),
    "FinalizeProposal",
    
    enum_name = "InstructionEnum",
)

def build_instruction(instruction, value = None):
    if instruction == InstructionEnum.enum.MintNft():
        return InstructionEnum.build(instruction) +  ClassEnum.build(value)
    else:
        return InstructionEnum.build(instruction)
