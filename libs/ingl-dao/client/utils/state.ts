import { GovernanceConfig, GovernanceInstruction } from "@solana/spl-governance";

export declare const GOVERNANCE_PROGRAM_SEED = "governance";
export declare const MINT_GOVERNANCE_SEED = "mint-governance";
export declare const NATIVE_TREASURY_SEED = "treasury";
export declare const GOVERNANCE_PROGRAM_CONFIG_SEED = "realm-config";
export declare const INGL_REALM_NAME = "ingl_dao";
export declare const INGL_GOVERNANCE_PROGRAM_ID = "ingl_dao";

export declare class CreateMintGovernanceArgs {
    instruction: GovernanceInstruction;
    config: GovernanceConfig;
    transferMintAuthorities: boolean;
    constructor(args: {
        config: GovernanceConfig;
        transferMintAuthorities: boolean;
    });
}