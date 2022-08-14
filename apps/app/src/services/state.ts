import { field, fixedArray, option, variant, vec } from '@dao-xyz/borsh';
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

class GemAccountVersions {}
@variant(1)
export class GemAccountV0_0_1_Version extends GemAccountVersions {}
@variant(0)
export class BlanckCase_Version extends GemAccountVersions {}

class FundsLocation {}
@variant(0)
export class MintingPoolFundLocation extends FundsLocation {}

@variant(1)
export class PDPoolFundLocation extends FundsLocation {}

@variant(2)
export class VoteAccountFundLocation extends FundsLocation {
  @field({ type: fixedArray('u8', 32) })
  vote_account_id!: number;

  constructor(vote_account_id: number) {
    super();
    this.vote_account_id = vote_account_id;
  }
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
  '41z2kpMac1RpH5XnBoKnY6vjmJwdbwc1aHRQszCgbyDv'
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
        ['validation_phrase', 'u32'],
        ['counter', 'u32'],
        ['total_raised', 'u64'],
        ['pd_pool_total', 'u64'],
        ['delegated_total', 'u64'],
        ['dealloced_total', 'u64'],
        ['is_proposal_ongoing', 'u8'],
        ['proposal_numeration', 'u32'],
        ['pending_delegation_total', 'u64'],
        ['validator_list', [['u8', 32]]],
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
  // [
  //   ValidatorProposal,
  //   {
  //     kind: 'struct',
  //     fields: [
  //       ['validator_ids', [['u8', 32]]],
  //       ['date_created', 'u32'],
  //       ['date_finalized', { kind: 'option', type: 'u32' }],
  //       ['votes', ['u32']],
  //       ['winner', { kind: 'option', type: ['u8', 32] }],
  //     ],
  //   },
  // ],
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

export class ValidatorProposal {
  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: vec(fixedArray('u8', 32)) })
  public validator_ids!: PublicKey[];

  @field({ type: 'u32' })
  public date_created!: number;

  @field({ type: option('u32') })
  public date_finalized!: undefined | number;

  @field({ type: vec('u32') })
  public votes!: number[];

  @field({ type: option(fixedArray('u8', 32)) })
  public winner!: undefined | PublicKey;

  constructor(properties?: {
    validation_phrase: number;
    validator_ids: PublicKey[];
    date_created: number;
    date_finalized: undefined | number;
    votes: number[];
    winner: undefined | PublicKey;
  }) {
    if (properties) {
      this.validation_phrase = properties.validation_phrase;
      this.validator_ids = properties.validator_ids;
      this.date_created = properties.date_created;
      this.date_finalized = properties.date_finalized;
      this.winner = properties.winner;
      this.votes = properties.votes;
    }
  }
}

export class ValidatorVote {
  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: fixedArray('u8', 32) })
  public proposal_id!: PublicKey;

  @field({ type: 'u32' })
  public validator_index!: number;

  constructor(properties?: {
    validation_phrase: number;
    proposal_id: PublicKey;
    validator_index: number;
  }) {
    if (properties) {
      this.validation_phrase = properties.validation_phrase;
      this.proposal_id = properties.proposal_id;
      this.validator_index = properties.validator_index;
    }
  }
}

export class GemAccountV0_0_1 {
  @field({ type: GemAccountVersions })
  public struct_id!: GemAccountVersions;

  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: 'u32' })
  public date_created!: number;

  @field({ type: 'u8' })
  public class!: number;

  @field({ type: 'u32' })
  public redeemable_date!: number;

  @field({ type: 'u32' })
  public numeration!: number;

  @field({ type: option('u8') })
  public rarity!: undefined | number;

  @field({ type: FundsLocation })
  public funds_location!: FundsLocation;

  @field({ type: option('u32') })
  public rarity_seed_time!: undefined | number;

  @field({ type: option('u32') })
  public date_allocated!: undefined | number;

  @field({ type: option(fixedArray('u8', 32)) })
  public last_voted_proposal!: undefined | PublicKey;

  @field({ type: option('u64') })
  public last_withdrawal_epoch!: undefined | number;

  @field({ type: option('u64') })
  public last_delegation_epoch!: undefined | number;

  @field({ type: vec('u64') })
  public all_withdraws!: PublicKey[];

  @field({ type: vec(ValidatorVote) })
  public all_votes!: ValidatorVote[];

  constructor(properties?: {
    struct_id: GemAccountVersions;
    validation_phrase: number;
    date_created: number;
    class: number;
    redeemable_date: number;
    numeration: number;
    rarity: undefined | number;
    funds_location: FundsLocation;
    rarity_seed_time: undefined | number;
    date_allocated: undefined | number;
    last_voted_proposal: undefined | PublicKey;
    last_withdrawal_epoch: undefined | number;
    last_delegation_epoch: undefined | number;
    all_withdraws: PublicKey[];
    all_votes: ValidatorVote[];
  }) {
    if (properties) {
      this.struct_id = properties.struct_id;
      this.validation_phrase = properties.validation_phrase;
      this.date_created = properties.date_created;
      this.class = properties.class;
      this.redeemable_date = properties.redeemable_date;
      this.numeration = properties.numeration;
      this.rarity = properties.rarity;
      this.funds_location = properties.funds_location;
      this.rarity_seed_time = properties.rarity_seed_time;
      this.date_allocated = properties.date_allocated;
      this.last_delegation_epoch = properties.last_delegation_epoch;
      this.last_withdrawal_epoch = properties.last_withdrawal_epoch;
      this.last_delegation_epoch = properties.last_delegation_epoch;
      this.all_withdraws = properties.all_withdraws;
      this.all_votes = properties.all_votes;
    }
  }
}
