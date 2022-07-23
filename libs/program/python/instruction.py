from borsh_construct import *
from state import *

InstructionEnum = Enum(
    "MintNft",
    "MintNewCollection",
    "Redeem",
    "ImprintRarity",
    "AllocateSol",
    "DeAllocateSol",
    "DelegateSol",
    "UndelegateSol",
    
    enum_name = "InstructionEnum",
)

def build_instruction(instruction, value = None):
    if instruction == "MintNft":
        return InstructionEnum.build(InstructionEnum.enum.MintNft()) +  ClassEnum.build(value)
    elif instruction == "MintNewCollection":
        return InstructionEnum.build(InstructionEnum.enum.MintNewCollection())
    elif instruction == "Redeem":
        return InstructionEnum.build(InstructionEnum.enum.Redeem())
    elif instruction == "ImprintRarity":
        return InstructionEnum.build(InstructionEnum.enum.ImprintRarity())
    elif instruction == "AllocateSol":
        return InstructionEnum.build(InstructionEnum.enum.AllocateSol())
    elif instruction == "DeAllocateSol":
        return InstructionEnum.build(InstructionEnum.enum.DeAllocateSol())
    elif instruction == "DelegateSol":
        return InstructionEnum.build(InstructionEnum.enum.DelegateSol())
    elif instruction == "UndelegateSol":
        return InstructionEnum.build(InstructionEnum.enum.UndelegateSol())