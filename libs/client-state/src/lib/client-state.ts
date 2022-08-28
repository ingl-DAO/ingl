import { field, fixedArray, option, variant, vec } from '@dao-xyz/borsh';
import { PublicKey } from '@solana/web3.js';
import * as BN from 'bn.js';

export enum NftClass {
  Ruby,
  Diamond,
  Sapphire,
  Emerald,
  Serendibite,
  Benitoite,
}
export type NftClassToString =
  | 'Benitoite'
  | 'Diamond'
  | 'Emerald'
  | 'Ruby'
  | 'Sapphire'
  | 'Serendibite';

export const inglGemSol: Record<NftClassToString, number> = {
  Ruby: 500,
  Diamond: 100,
  Sapphire: 50,
  Emerald: 10,
  Serendibite: 5,
  Benitoite: 1,
};

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
  ValidatorWithdraw,
  NFTWithdraw,
  ProcessRewards,
  CloseProposal,
  InitRebalance,
  FinalizeRebalance,
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
  '9dSZN479QxPdogZTwjaBRiTfFAvhq3kNF1GEwUWW7es6'
);
export const STAKE_PROGRAM_ID = new PublicKey(
  'Stake11111111111111111111111111111111111111'
);
export const STAKE_CONFIG_PROGRAM_ID = new PublicKey(
  'StakeConfig11111111111111111111111111111111'
);
export const SYSVAR_STAKE_HISTORY_ID = new PublicKey(
  'SysvarStakeHistory1111111111111111111111111'
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
export const TREASURY_ACCOUNT_KEY = 'Treasury_account_key';
export const STAKE_ACCOUNT_KEY = 'staking_account_key';
export const VOTE_DATA_ACCOUNT_KEY = 'InglVoteData';
export const NFTS_SHARE = 60;
export const CONNECTION_URL = 'https://api.devnet.solana.com';

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

export class ValidatorProposal {
  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: vec(fixedArray('u8', 32)) })
  public validator_ids!: PublicKey[];

  @field({ type: 'u32' })
  public date_created!: number;

  @field({ type: option('u32') })
  public date_finalized?: number;

  @field({ type: vec('u32') })
  public votes!: number[];

  @field({ type: option(fixedArray('u8', 32)) })
  public winner?: PublicKey;

  constructor(properties?: {
    validation_phrase: number;
    validator_ids: PublicKey[];
    date_created: number;
    date_finalized?: number;
    votes: number[];
    winner?: PublicKey;
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
  public rarity?: number;

  @field({ type: FundsLocation })
  public funds_location!: FundsLocation;

  @field({ type: option('u32') })
  public rarity_seed_time?: number;

  @field({ type: option('u32') })
  public date_allocated?: number;

  @field({ type: option(fixedArray('u8', 32)) })
  public last_voted_proposal?: PublicKey;

  @field({ type: option('u64') })
  public last_withdrawal_epoch?: BN;

  @field({ type: option('u64') })
  public last_delegation_epoch?: BN;

  @field({ type: vec('u64') })
  public all_withdraws!: BN[];

  @field({ type: vec(ValidatorVote) })
  public all_votes!: ValidatorVote[];

  constructor(properties?: {
    struct_id: GemAccountVersions;
    validation_phrase: number;
    date_created: number;
    class: number;
    redeemable_date: number;
    numeration: number;
    rarity: number;
    funds_location: FundsLocation;
    rarity_seed_time?: number;
    date_allocated?: number;
    last_voted_proposal?: PublicKey;
    last_withdrawal_epoch?: BN;
    last_delegation_epoch?: BN;
    all_withdraws: BN[];
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
      this.last_voted_proposal = properties.last_voted_proposal;
      this.last_delegation_epoch = properties.last_delegation_epoch;
      this.last_withdrawal_epoch = properties.last_withdrawal_epoch;
      this.all_withdraws = properties.all_withdraws;
      this.all_votes = properties.all_votes;
    }
  }
}

export class GlobalGems {
  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: 'u32' })
  public counter!: number;

  @field({ type: 'u64' })
  public total_raised!: BN;

  @field({ type: 'u64' })
  public pd_pool_total!: BN;

  @field({ type: 'u64' })
  public delegated_total!: BN;

  @field({ type: 'u64' })
  public dealloced_total!: BN;

  @field({ type: 'u8' })
  public is_proposal_ongoing!: number;

  @field({ type: 'u32' })
  public proposal_numeration!: number;

  @field({ type: 'u64' })
  public pending_delegation_total!: BN;

  @field({ type: vec(fixedArray('u8', 32)) })
  public validator_list!: PublicKey[];

  constructor(properties?: {
    validation_phrase: number;
    counter: number;
    total_raised: BN;
    pd_pool_total: BN;
    delegated_total: BN;
    dealloced_total: BN;
    is_proposal_ongoing: number;
    proposal_numeration: number;
    pending_delegation_total: BN;
    validator_list: PublicKey[];
  }) {
    if (properties) {
      this.validation_phrase = properties.validation_phrase;
      this.counter = properties.counter;
      this.total_raised = properties.total_raised;
      this.pd_pool_total = properties.pd_pool_total;
      this.delegated_total = properties.delegated_total;
      this.dealloced_total = properties.dealloced_total;
      this.is_proposal_ongoing = properties.is_proposal_ongoing;
      this.proposal_numeration = properties.proposal_numeration;
      this.pending_delegation_total = properties.pending_delegation_total;
      this.validator_list = properties.validator_list;
    }
  }
}

export class VoteRewards {
  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: 'u64' })
  public epoch_number!: BN;

  @field({ type: 'u64' })
  public total_reward!: BN;

  @field({ type: 'u64' })
  public total_stake!: BN;

  constructor(properties?: {
    validation_phrase: number;
    epoch_number: BN;
    total_reward: BN;
    total_stake: BN;
  }) {
    if (properties) {
      this.validation_phrase = properties.validation_phrase;
      this.epoch_number = properties.epoch_number;
      this.total_reward = properties.total_reward;
      this.total_stake = properties.total_stake;
    }
  }
}

export class VoteInit {
  @field({ type: fixedArray('u8', 32) })
  public node_pubkey!: PublicKey;

  @field({ type: fixedArray('u8', 32) })
  public authorized_voter!: PublicKey;

  @field({ type: fixedArray('u8', 32) })
  public authorized_withdrawer!: PublicKey;

  @field({ type: fixedArray('u8', 32) })
  public commission!: PublicKey;

  constructor(properties?: {
    node_pubkey: PublicKey;
    authorized_voter: PublicKey;
    authorized_withdrawer: PublicKey;
    commission: PublicKey;
  }) {
    if (properties) {
      this.node_pubkey = properties.node_pubkey;
      this.authorized_voter = properties.authorized_voter;
      this.authorized_withdrawer = properties.authorized_withdrawer;
      this.commission = properties.commission;
    }
  }
}

export class InglVoteAccountData {
  @field({ type: 'u32' })
  public validation_phrase!: number;

  @field({ type: 'u64' })
  public total_delegated!: BN;

  @field({ type: 'u64' })
  public last_withdraw_epoch!: BN;

  @field({ type: 'u64' })
  public dealloced!: BN;

  @field({ type: option('u64') })
  public pending_validator_rewards!: BN | undefined;

  @field({ type: fixedArray('u8', 32) })
  public validator_id!: PublicKey;

  @field({ type: 'u64' })
  public last_total_staked!: BN;

  @field({ type: 'u8' })
  public is_t_stake_initialized!: boolean;

  @field({ type: 'u64' })
  public pending_delegation_total!: BN;

  @field({ type: vec(VoteRewards) })
  public vote_rewards!: VoteRewards[];

  constructor(properties?: {
    validation_phrase: number;
    total_delegated: BN;
    last_withdraw_epoch: BN;
    dealloced: BN;
    pending_validator_rewards: BN;
    validator_id: PublicKey;
    last_total_staked: BN;
    is_t_stake_initialized: boolean;
    pending_delegation_total: BN;
    vote_rewards: VoteRewards[];
  }) {
    if (properties) {
      this.validation_phrase = properties.validation_phrase;
      this.total_delegated = properties.total_delegated;
      this.last_withdraw_epoch = properties.last_withdraw_epoch;
      this.dealloced = properties.dealloced;
      this.pending_validator_rewards = properties.pending_validator_rewards;
      this.validator_id = properties.validator_id;
      this.last_total_staked = properties.last_total_staked;
      this.is_t_stake_initialized = properties.is_t_stake_initialized;
      this.pending_delegation_total = properties.pending_delegation_total;
      this.vote_rewards = properties.vote_rewards;
    }
  }
}
