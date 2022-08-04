import { PublicKey } from '@solana/web3.js';

export enum NftClass {
  Ruby,
  Diamond,
  Sapphire,
  Emerald,
  Serendibite,
  Benitoite,
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
