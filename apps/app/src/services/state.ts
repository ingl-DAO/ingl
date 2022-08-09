import { PublicKey } from '@solana/web3.js';
import { deserializeUnchecked } from 'borsh';

export enum NftClass {
  Ruby,
  Diamond,
  Sapphire,
  Emerald,
  Serendibite,
  Benitoite,
}

export enum Rarity {
  Common,
  Uncommon,
  Rare,
  Exalted,
  Mythic,
}

export enum Instruction {
  MintNft,
  MintNewCollection,
  Redeem,
  ImprintRarity,
  AllocateSol,
  DeAllocateSol,
  CreateVoteAccount,
  ChangeVoteAccountsValidatorIdentity,
  DelegateSol,
  UnDelegateSol,
  InitRarityImprint,
  RegisterValidatorId,
  CreateValidatorSelectionProposal,
  VoteValidatorProposal,
  FinalizeProposal,
}

export enum FundsLocation {
  MintingPool,
  PDPool,
  VoteAccount,
}

export enum GemAccountVersions {
  GemAccountV0_0_1,
  BlanckCase,
}

export const BTC_HISTORY_BUFFER_KEY = new PublicKey(
  '9ATrvi6epR5hVYtwNs7BB7VCiYnd4WM7e8MfafWpfiXC'
);
export const SOL_HISTORY_BUFFER_KEY = new PublicKey(
  '7LLvRhMs73FqcLkA8jvEE1AM2mYZXTmqfUv8GAEurymx'
);
export const ETH_HISTORY_BUFFER_KEY = new PublicKey(
  '6fhxFvPocWapZ5Wa2miDnrX2jYRFKvFqYnX11GGkBo2f'
);
export const BNB_HISTORY_BUFFER_KEY = new PublicKey(
  'DR6PqK15tD21MEGSLmDpXwLA7Fw47kwtdZeUMdT7vd7L'
);
export const INGL_PROGRAM_ID = new PublicKey(
  '6rdpYzThSFYtEa9bSJYGemkN2MSNU8JWh1SNT67YZJ1v'
);
export const INGL_TREASURY_ACCOUNT_KEY = 'ingl_treasury_account_key';
export const AUTHORIZED_WITHDRAWER_KEY = 'InglAuthorizedWithdrawer';
export const INGL_NFT_COLLECTION_KEY = 'ingl_nft_collection_newer';
export const COUNCIL_MINT_AUTHORITY_KEY = 'council_mint_authority';
export const COLLECTION_HOLDER_KEY = 'collection_holder';
export const INGL_MINT_AUTHORITY_KEY = 'mint_authority';
export const INGL_MINTING_POOL_KEY = 'minting_pool';
export const GLOBAL_GEM_KEY = 'global_gem_account';
export const GEM_ACCOUNT_CONST = 'gem_account';
export const COUNCIL_MINT_KEY = 'council_mint';
export const PROPOSAL_KEY = 'ingl_proposals';
export const VOTE_ACCOUNT_KEY = 'InglVote';
export const TREASURY_FEE_MULTIPLYER = 70;
export const PRICE_TIME_INTERVAL = 20;
export const PD_POOL_KEY = 'pd_pool';
export const FEE_MULTIPLYER = 10;

class Assignable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(properties: any) {
    Object.keys(properties).map((key) => {
      return (this[key] = properties[key]);
    });
  }
}

export class VoteInit extends Assignable {}
export class GlobalGems extends Assignable {}
// export class VoteRewards extends Assignable {}
export class ValidatorVote extends Assignable {}
export class GemAccountV0_0_1 extends Assignable {}
// export class ValidatorProposal extends Assignable {}
// export class ProgramVoteAccount extends Assignable {}
// export class InglVoteAccountData extends Assignable {}

class Enum {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(properties: any) {
    if (Object.keys(properties).length !== 1) {
      throw new Error('Enum can only take single value');
    }
    Object.keys(properties).map((key) => {
      this[key] = properties[key];
      this['enum'] = key;
      return this;
    });
  }
}

// export class ClassEnum extends Enum {}
// export class RubyOption extends Assignable {}
// export class DiamondOption extends Assignable {}
// export class SapphireOption extends Assignable {}
// export class EmeraldOption extends Assignable {}
// export class SerendibiteOption extends Assignable {}
// export class BenitoiteOption extends Assignable {}

// export class RarityEnum extends Enum {}
// export class CommonOption extends Assignable {}
// export class UncommonOption extends Assignable {}
// export class RareOption extends Assignable {}
// export class ExaltedOption extends Assignable {}
// export class MythicOption extends Assignable {}

export class FundsLocationEnum extends Enum {}
export class MintingPoolOption extends Assignable {}
export class PDPoolOption extends Assignable {}
export class VoteAccountOption extends Assignable {}

// export class GemAccountVersionsEnum extends Enum {}
// export class GemAccountV0_0_1Option extends Assignable {}
// export class BlanckCaseOption extends Assignable {}

const INGL_SCHEMA = new Map([
  [
    VoteInit,
    {
      kind: 'struct',
      fields: [
        ['commission', 'u8'],
        ['node_pubkey', ['u8', 32]],
        ['authority_voter', ['u8', 32]],
        ['authorized_withdrawer', ['u8', 32]],
      ],
    },
  ],
  [
    GlobalGems,
    {
      kind: 'struct',
      fields: [
        ['counter', 'u32'],
        ['total_raised', 'u64'],
        ['pd_pool_total', 'u64'],
        ['is_proposal_ongoing', 'u8'],
        ['proposal_numeration', 'u32'],
        ['validator_list', [['u8', 32]]],
      ],
    },
  ],
  [
    ValidatorVote,
    {
      kind: 'struct',
      fields: [
        ['proposal_id', ['u8', 32]],
        ['validator_index', 'u32'],
      ],
    },
  ],
  [
    GemAccountV0_0_1,
    {
      kind: 'struct',
      fields: [
        ['struct_id', 'u8'],
        ['date_created', 'u32'],
        ['class', 'u8'],
        ['redeemable_date', 'u32'],
        ['numeration', 'u32'],
        ['rarity', { kind: 'option', type: 'u8' }],
        ['funds_location', FundsLocationEnum],
        ['rarity_seed_time', { kind: 'option', type: 'u32' }],
        ['date_allocated', { kind: 'option', type: 'u32' }],
        ['last_voted_proposal', { kind: 'option', type: ['u8', 32] }],
        ['all_votes', [ValidatorVote]],
      ],
    },
  ],
  [
    FundsLocationEnum,
    {
      kind: 'enum',
      field: 'enum',
      values: [
        ['mintingPool', MintingPoolOption],
        ['pDPool', PDPoolOption],
        ['voteAccount', VoteAccountOption],
      ],
    },
  ],
  [
    MintingPoolOption,
    {
      kind: 'struct',
      fields: [],
    },
  ],
  [
    PDPoolOption,
    {
      kind: 'struct',
      fields: [],
    },
  ],
  [
    VoteAccountOption,
    {
      kind: 'struct',
      fields: [['id', ['u8', 32]]],
    },
  ],
]);

export async function decodeInglData<T>(
  classType: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (args: any): T;
  },
  buffer: Buffer
) {
  return deserializeUnchecked(INGL_SCHEMA, classType, buffer);
}
