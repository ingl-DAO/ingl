import {
  NftClass,
  Instruction,
  INGL_PROGRAM_ID,
  INGL_MINT_AUTHORITY_KEY,
  GLOBAL_GEM_KEY,
  GEM_ACCOUNT_CONST,
  INGL_MINTING_POOL_KEY,
  INGL_NFT_COLLECTION_KEY,
  BTC_HISTORY_BUFFER_KEY,
  SOL_HISTORY_BUFFER_KEY,
  ETH_HISTORY_BUFFER_KEY,
  BNB_HISTORY_BUFFER_KEY,
  INGL_TREASURY_ACCOUNT_KEY,
  GemAccountV0_0_1,
  PD_POOL_KEY,
  PDPoolFundLocation,
  VoteAccountFundLocation,
  VOTE_DATA_ACCOUNT_KEY,
  VOTE_ACCOUNT_KEY,
  AUTHORIZED_WITHDRAWER_KEY,
  InglVoteAccountData,
  STAKE_PROGRAM_ID,
  NftClassToString,
  NFTS_SHARE,
  inglGemSol,
} from './state';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  AccountMeta,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  STAKE_CONFIG_ID,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PROGRAM_ID as METAPLEX_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { LazyNft, Metaplex, Nft } from '@metaplex-foundation/js';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import * as uint32 from 'uint32';
import { Gem } from '../components/wallet';
import { getGlobalGemData } from './validator-dao.service';
import BN from 'bn.js';
import { deserializeUnchecked } from '@dao-xyz/borsh';
import { inglGem } from '../components/nftDisplay';
import { signAndConfirmTransaction, toBytesInt32 } from './utils';

const [minting_pool_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(INGL_MINTING_POOL_KEY)],
  INGL_PROGRAM_ID
);
const [mint_authority_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(INGL_MINT_AUTHORITY_KEY)],
  INGL_PROGRAM_ID
);
const [ingl_nft_collection_mint_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(INGL_NFT_COLLECTION_KEY)],
  INGL_PROGRAM_ID
);
const [ingl_nft_collection_key] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('metadata'),
    METAPLEX_PROGRAM_ID.toBuffer(),
    ingl_nft_collection_mint_key.toBuffer(),
  ],
  METAPLEX_PROGRAM_ID
);
const [program_treasury_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(INGL_TREASURY_ACCOUNT_KEY)],
  INGL_PROGRAM_ID
);
const [global_gem_pubkey] = PublicKey.findProgramAddressSync(
  [Buffer.from(GLOBAL_GEM_KEY)],
  INGL_PROGRAM_ID
);
const [pd_pool_account_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(PD_POOL_KEY)],
  INGL_PROGRAM_ID
);
const [authorized_withdrawer_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(AUTHORIZED_WITHDRAWER_KEY)],
  INGL_PROGRAM_ID
);

export async function mintInglGem(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  nftClass: NftClass
) {
  const {
    wallet: { publicKey: payerKey },
  } = walletConnection;
  if (!payerKey) throw new Error('Please connect your wallet');

  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };

  const mintKeyPair = Keypair.generate();
  const mintAccount: AccountMeta = {
    pubkey: mintKeyPair.publicKey,
    isSigner: true,
    isWritable: true,
  };

  const mintAuthorityAccount: AccountMeta = {
    pubkey: mint_authority_key,
    isSigner: false,
    isWritable: true,
  };

  const splTokenProgramAccount: AccountMeta = {
    pubkey: TOKEN_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };

  const sysvarRentAccount: AccountMeta = {
    pubkey: SYSVAR_RENT_PUBKEY,
    isSigner: false,
    isWritable: false,
  };

  const systemProgramAccount: AccountMeta = {
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  };

  const [metaplex_account_key] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      mintAccount.pubkey.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );

  const metadataAccount: AccountMeta = {
    pubkey: metaplex_account_key,
    isSigner: false,
    isWritable: true,
  };

  const globalGemAccount: AccountMeta = {
    pubkey: global_gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), mintKeyPair.publicKey.toBuffer()],
    INGL_PROGRAM_ID
  );

  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const metaplexProgramAccount: AccountMeta = {
    pubkey: METAPLEX_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };

  const mintingPoolAccount: AccountMeta = {
    pubkey: minting_pool_key,
    isSigner: false,
    isWritable: true,
  };

  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(
      mintKeyPair.publicKey,
      payerAccount.pubkey
    ),
    isSigner: false,
    isWritable: true,
  };

  const inglNftCollectionMintAccount: AccountMeta = {
    pubkey: ingl_nft_collection_mint_key,
    isSigner: false,
    isWritable: false,
  };

  const [ingl_nft_collection_metadata_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      ingl_nft_collection_mint_key.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );
  const inglNftCollectionAccount: AccountMeta = {
    pubkey: ingl_nft_collection_metadata_key,
    isSigner: false,
    isWritable: false,
  };

  const [nft_edition_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      mintAccount.pubkey.toBuffer(),
      Buffer.from('edition'),
    ],
    METAPLEX_PROGRAM_ID
  );
  const nftEditionAccount: AccountMeta = {
    pubkey: nft_edition_key,
    isSigner: false,
    isWritable: true,
  };

  const [collection_edition_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      ingl_nft_collection_mint_key.toBuffer(),
      Buffer.from('edition'),
    ],
    METAPLEX_PROGRAM_ID
  );
  const collectionEditionAccount: AccountMeta = {
    pubkey: collection_edition_key,
    isSigner: false,
    isWritable: true,
  };

  const associatedTokeProgramAccount: AccountMeta = {
    pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };

  const mintNftInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.MintNft, nftClass]),
    keys: [
      payerAccount,
      mintAccount,
      mintAuthorityAccount,
      associatedTokenAccount,
      splTokenProgramAccount,
      sysvarRentAccount,
      systemProgramAccount,
      metadataAccount,
      mintingPoolAccount,
      globalGemAccount,
      gemAccount,
      collectionEditionAccount,
      nftEditionAccount,
      inglNftCollectionMintAccount,
      inglNftCollectionAccount,

      systemProgramAccount,
      splTokenProgramAccount,
      associatedTokeProgramAccount,
      metaplexProgramAccount,
    ],
  });
  try {
    await signAndConfirmTransaction(
      walletConnection,
      mintNftInstruction,
      mintKeyPair,
      240_000
    );
  } catch (error) {
    throw new Error('NFT Minting transaction failed with error ' + error);
  }
}

export async function imprintRarity(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  tokenMint: PublicKey
) {
  const {
    wallet: { publicKey: payerKey },
    connection,
  } = walletConnection;
  if (!payerKey) throw new WalletNotConnectedError();

  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };
  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );

  const accountInfo = await connection.getAccountInfo(gem_pubkey);
  const gemAccountData = deserializeUnchecked(
    GemAccountV0_0_1,
    accountInfo?.data as Buffer
  );

  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const mintAccount: AccountMeta = {
    pubkey: tokenMint,
    isSigner: false,
    isWritable: false,
  };
  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(
      mintAccount.pubkey,
      payerAccount.pubkey
    ),
    isSigner: false,
    isWritable: true,
  };
  const [mint_authority_key] = await PublicKey.findProgramAddress(
    [Buffer.from(INGL_MINT_AUTHORITY_KEY)],
    INGL_PROGRAM_ID
  );

  const mintAuthorityAccount: AccountMeta = {
    pubkey: mint_authority_key,
    isSigner: false,
    isWritable: true,
  };
  const [nft_edition_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from('edition'),
    ],
    METAPLEX_PROGRAM_ID
  );
  const nftEditionAccount: AccountMeta = {
    pubkey: nft_edition_key,
    isSigner: false,
    isWritable: false,
  };

  const [metadata_account_key] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );

  const metadataAccount: AccountMeta = {
    pubkey: metadata_account_key,
    isSigner: false,
    isWritable: true,
  };

  const btcFeedAccount: AccountMeta = {
    pubkey: BTC_HISTORY_BUFFER_KEY,
    isSigner: false,
    isWritable: false,
  };
  const solFeedAccount: AccountMeta = {
    pubkey: SOL_HISTORY_BUFFER_KEY,
    isSigner: false,
    isWritable: false,
  };
  const ethFeedAccount: AccountMeta = {
    pubkey: ETH_HISTORY_BUFFER_KEY,
    isSigner: false,
    isWritable: false,
  };
  const bnbFeedAccount: AccountMeta = {
    pubkey: BNB_HISTORY_BUFFER_KEY,
    isSigner: false,
    isWritable: false,
  };

  const splTokenProgramAccount: AccountMeta = {
    pubkey: TOKEN_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };
  const metaplexProgramAccount: AccountMeta = {
    pubkey: METAPLEX_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };
  console.log(gemAccountData);
  const initRarityImprintIntrustion = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.InitRarityImprint]),
    keys: [
      payerAccount,
      gemAccount,
      mintAccount,
      associatedTokenAccount,
      mintAuthorityAccount,
      nftEditionAccount,

      splTokenProgramAccount,
      metaplexProgramAccount,
    ],
  });

  const imprintRarityInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.ImprintRarity]),
    keys: [
      payerAccount,
      gemAccount,
      mintAccount,
      associatedTokenAccount,
      mintAuthorityAccount,
      metadataAccount,
      nftEditionAccount,

      btcFeedAccount,
      solFeedAccount,
      ethFeedAccount,
      bnbFeedAccount,

      splTokenProgramAccount,
      metaplexProgramAccount,
    ],
  });
  if (!gemAccountData.rarity_seed_time) {
    try {
      await signAndConfirmTransaction(
        walletConnection,
        initRarityImprintIntrustion
      );

      await new Promise((resolve, reject) =>
        setTimeout(async () => {
          try {
            const transactionId = await signAndConfirmTransaction(
              walletConnection,
              imprintRarityInstruction
            );
            resolve(transactionId);
          } catch (error) {
            reject(error);
          }
        }, 20000)
      );
    } catch (error) {
      throw new Error('Failed to imprint rarity with error ' + error);
    }
  } else if (gemAccountData.rarity === undefined) {
    try {
      const transactionId = await signAndConfirmTransaction(
        walletConnection,
        imprintRarityInstruction
      );
      return transactionId;
    } catch (error) {
      throw new Error('Failed to imprint rarity with error ' + error);
    }
  }
}

export async function redeemInglGem(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  tokenMint: PublicKey
) {
  const {
    wallet: { publicKey: payerKey },
  } = walletConnection;
  if (!payerKey) throw new WalletNotConnectedError();

  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };

  const mintAccount: AccountMeta = {
    pubkey: tokenMint,
    isSigner: false,
    isWritable: true,
  };

  const mintingPoolAccount: AccountMeta = {
    pubkey: minting_pool_key,
    isSigner: false,
    isWritable: true,
  };

  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(tokenMint, payerAccount.pubkey),
    isSigner: false,
    isWritable: true,
  };

  const mintAuthorityAccount: AccountMeta = {
    pubkey: mint_authority_key,
    isSigner: false,
    isWritable: true,
  };

  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );
  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const [metaplexAccountKey] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );

  const metadataAccount: AccountMeta = {
    pubkey: metaplexAccountKey,
    isSigner: false,
    isWritable: true,
  };

  const [edition_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from('edition'),
    ],
    METAPLEX_PROGRAM_ID
  );
  const editionAccount: AccountMeta = {
    pubkey: edition_key,
    isSigner: false,
    isWritable: true,
  };

  const inglNftCollectionAccount: AccountMeta = {
    pubkey: ingl_nft_collection_key,
    isSigner: false,
    isWritable: true,
  };

  const splTokenProgramAccount: AccountMeta = {
    pubkey: TOKEN_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };

  const programTreasuryAccount: AccountMeta = {
    pubkey: program_treasury_key,
    isSigner: false,
    isWritable: true,
  };

  const systemProgramAccount: AccountMeta = {
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  };
  const metaplexProgramAccount: AccountMeta = {
    pubkey: METAPLEX_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };

  const redeemInglGemInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.Redeem]),
    keys: [
      payerAccount,
      mintAccount,
      mintingPoolAccount,
      associatedTokenAccount,
      mintAuthorityAccount,
      gemAccount,
      metadataAccount,
      editionAccount,
      inglNftCollectionAccount,
      splTokenProgramAccount,
      programTreasuryAccount,

      systemProgramAccount,
      metaplexProgramAccount,
    ],
  });

  try {
    await signAndConfirmTransaction(walletConnection, redeemInglGemInstruction);
  } catch (error) {
    throw new Error('Failed to imprint rarity with error ' + error);
  }
}

const getInglGemFromNft = async (
  connection: Connection,
  nft: Nft
): Promise<inglGem> => {
  const {
    mint: { address },
    json,
  } = nft;
  if (json) {
    const { attributes, image, properties } = json;
    const [gem_pubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from(GEM_ACCOUNT_CONST), address.toBuffer()],
      INGL_PROGRAM_ID
    );
    const accountInfo = await connection.getAccountInfo(gem_pubkey);
    // deserialize buffer data into readable format
    const {
      rarity,
      funds_location,
      date_allocated,
      last_voted_proposal,
      rarity_seed_time,
    } = deserializeUnchecked(GemAccountV0_0_1, accountInfo?.data as Buffer);
    return {
      image_ref: image,
      generation: Number(
        attributes?.find(({ trait_type }) => trait_type === 'Generation')?.value
      ),
      nft_id: address.toString(),
      gemClass: attributes?.find(({ trait_type }) => trait_type === 'Class')
        ?.value,
      has_loan: false,
      video_ref: properties?.files?.find((file) => file.type === 'video/mp4')
        ?.uri,
      rarity: rarity,
      is_allocated: funds_location instanceof PDPoolFundLocation,
      is_delegated: funds_location instanceof VoteAccountFundLocation,
      allocation_date: date_allocated,
      rarity_reveal_date: rarity_seed_time,
      last_voted_proposal_id: last_voted_proposal
        ? last_voted_proposal.toString()
        : '',
    };
  }
  throw new Error('No json fields was found on metadata');
};

export async function loadInglGems(
  connection: Connection,
  ownerPubkey: PublicKey
) {
  const metaplex = new Metaplex(connection);
  const metaplexNft = metaplex.nfts();

  try {
    let lazyNfts = await metaplexNft.findAllByOwner(ownerPubkey).run();
    lazyNfts = lazyNfts.filter(
      ({ collection }) =>
        collection?.key.toString() === ingl_nft_collection_mint_key.toString()
    );
    const myInglGems: inglGem[] = [];
    for (let i = 0; i < lazyNfts.length; i++) {
      const inglNft = await metaplexNft.loadNft(lazyNfts[i] as LazyNft).run();
      const inglGem = await getInglGemFromNft(connection, inglNft);
      myInglGems.push(inglGem);
    }
    return myInglGems;
  } catch (error) {
    throw new Error('Failed to load metadata with error ' + error);
  }
}

export async function loadGem(connection: Connection, tokenMint: PublicKey) {
  const metaplex = new Metaplex(connection);
  const metaplexNft = metaplex.nfts();

  try {
    const inglNft = await metaplexNft.findByMint(tokenMint).run();
    return await getInglGemFromNft(connection, inglNft);
  } catch (error) {
    throw new Error('Failed to load by mint with error ' + error);
  }
}

const getAllocateInstructionAccounts = async (
  tokenMint: PublicKey,
  payerKey: PublicKey
) => {
  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };
  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );
  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const mintAccount: AccountMeta = {
    pubkey: tokenMint,
    isSigner: false,
    isWritable: false,
  };
  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(
      mintAccount.pubkey,
      payerAccount.pubkey
    ),
    isSigner: false,
    isWritable: true,
  };
  const globalGemAccount: AccountMeta = {
    pubkey: global_gem_pubkey,
    isSigner: false,
    isWritable: true,
  };
  const pDPoolAccount: AccountMeta = {
    pubkey: pd_pool_account_key,
    isSigner: false,
    isWritable: true,
  };
  const mintingPoolAccount: AccountMeta = {
    pubkey: minting_pool_key,
    isSigner: false,
    isWritable: true,
  };
  const systemProgramAccount: AccountMeta = {
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  };

  return [
    payerAccount,
    mintAccount,
    gemAccount,
    associatedTokenAccount,
    globalGemAccount,
    pDPoolAccount,
    mintingPoolAccount,

    systemProgramAccount,
  ];
};

export async function allocateSol(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  tokenMint: PublicKey
) {
  const {
    wallet: { publicKey: payerKey },
  } = walletConnection;

  const allocationNftInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.AllocateSol]),
    keys: await getAllocateInstructionAccounts(
      tokenMint,
      payerKey as PublicKey
    ),
  });

  try {
    await signAndConfirmTransaction(walletConnection, allocationNftInstruction);
  } catch (error) {
    throw new Error('Failed to allocate gem sol with error ' + error);
  }
}

export async function deallocatedSol(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  tokenMint: PublicKey
) {
  const {
    wallet: { publicKey: payerKey },
  } = walletConnection;

  const allocationNftInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.DeAllocateSol]),
    keys: await getAllocateInstructionAccounts(
      tokenMint,
      payerKey as PublicKey
    ),
  });

  try {
    await signAndConfirmTransaction(walletConnection, allocationNftInstruction);
  } catch (error) {
    throw new Error('Failed to deallocate gem sol with error ' + error);
  }
}

const getDelegateInstructionAccounts = async ({
  voteMint,
  tokenMint,
  payerKey,
}: {
  tokenMint: PublicKey;
  voteMint: PublicKey;
  payerKey: PublicKey;
}) => {
  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };
  const voteAccount: AccountMeta = {
    pubkey: voteMint,
    isSigner: false,
    isWritable: false,
  };

  const [ignl_vote_account_data__key] = PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_DATA_ACCOUNT_KEY), voteMint.toBuffer()],
    INGL_PROGRAM_ID
  );

  const ignlVoteAccountData: AccountMeta = {
    pubkey: ignl_vote_account_data__key,
    isSigner: false,
    isWritable: true,
  };

  const mintAccount: AccountMeta = {
    pubkey: tokenMint,
    isSigner: false,
    isWritable: false,
  };

  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );
  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(
      mintAccount.pubkey,
      payerAccount.pubkey
    ),
    isSigner: false,
    isWritable: true,
  };
  const globalGemAccount: AccountMeta = {
    pubkey: global_gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const sysvarClockAccount: AccountMeta = {
    pubkey: SYSVAR_CLOCK_PUBKEY,
    isSigner: false,
    isWritable: true,
  };

  const stakeConfigProgramAccount: AccountMeta = {
    pubkey: STAKE_CONFIG_ID,
    isSigner: false,
    isWritable: false,
  };

  const systemProgramAccount: AccountMeta = {
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  };
  const stakeProgramAccount: AccountMeta = {
    pubkey: STAKE_PROGRAM_ID,
    isSigner: false,
    isWritable: false,
  };

  return [
    payerAccount,
    voteAccount,
    ignlVoteAccountData,
    mintAccount,
    gemAccount,
    associatedTokenAccount,
    globalGemAccount,
    sysvarClockAccount,
    stakeConfigProgramAccount,

    systemProgramAccount,
    stakeProgramAccount,
  ];
};

const getUnDelegateInstructionAccounts = async ({
  voteMint,
  tokenMint,
  payerKey,
}: {
  tokenMint: PublicKey;
  voteMint: PublicKey;
  payerKey: PublicKey;
}) => {
  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };
  const pDPoolAccount: AccountMeta = {
    pubkey: pd_pool_account_key,
    isSigner: false,
    isWritable: true,
  };

  const voteAccount: AccountMeta = {
    pubkey: voteMint,
    isSigner: false,
    isWritable: false,
  };

  const [ignl_vote_account_data__key] = PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_DATA_ACCOUNT_KEY), voteMint.toBuffer()],
    INGL_PROGRAM_ID
  );

  const ignlVoteAccountData: AccountMeta = {
    pubkey: ignl_vote_account_data__key,
    isSigner: false,
    isWritable: true,
  };

  const mintAccount: AccountMeta = {
    pubkey: tokenMint,
    isSigner: false,
    isWritable: false,
  };

  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );
  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(
      mintAccount.pubkey,
      payerAccount.pubkey
    ),
    isSigner: false,
    isWritable: true,
  };
  const globalGemAccount: AccountMeta = {
    pubkey: global_gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  return [
    payerAccount,
    pDPoolAccount,
    voteAccount,
    ignlVoteAccountData,
    mintAccount,
    gemAccount,
    associatedTokenAccount,
    globalGemAccount,
  ];
};

export async function delegateNft(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  {
    voteMint,
    tokenMint,
  }: {
    tokenMint: PublicKey;
    voteMint: PublicKey;
  }
) {
  const {
    wallet: { publicKey: payerKey },
  } = walletConnection;
  console.log(voteMint, tokenMint);
  const delegateSolInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.DelegateSol]),
    keys: await getDelegateInstructionAccounts({
      voteMint,
      tokenMint,
      payerKey: payerKey as PublicKey,
    }),
  });

  try {
    await signAndConfirmTransaction(walletConnection, delegateSolInstruction);
  } catch (error) {
    throw new Error('Failed to deallocate gem sol with error ' + error);
  }
}

export async function undelegateNft(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  tokenMint: PublicKey
) {
  const {
    wallet: { publicKey: payerKey },
    connection,
  } = walletConnection;
  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );
  const accountInfo = await connection.getAccountInfo(gem_pubkey);
  const gemAccountData = deserializeUnchecked(
    GemAccountV0_0_1,
    accountInfo?.data as Buffer
  );
  const funds_location = gemAccountData.funds_location;

  if (funds_location instanceof VoteAccountFundLocation) {
    const voteMint = new PublicKey(funds_location.vote_account_id);
    const accountsMeta = await getUnDelegateInstructionAccounts({
      voteMint,
      tokenMint,
      payerKey: payerKey as PublicKey,
    });

    const delegateSolInstruction = new TransactionInstruction({
      programId: INGL_PROGRAM_ID,
      data: Buffer.from([Instruction.UnDelegateSol]),
      keys: accountsMeta,
    });
    try {
      await signAndConfirmTransaction(walletConnection, delegateSolInstruction);
    } catch (error) {
      throw new Error('Failed to undelegate gem  with error ' + error);
    }
  } else {
    throw new Error('Gem is not delegated');
  }
}

export async function getVoteAccounts(connection: Connection) {
  try {
    let proposalNumeration = (await getGlobalGemData(connection))
      .proposal_numeration;
    const votesIds: { vote_account: PublicKey; validator_id: PublicKey }[] = [];
    while (proposalNumeration > 0) {
      const [vote_account_key] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(VOTE_ACCOUNT_KEY),
          Buffer.from(toBytesInt32(--proposalNumeration)),
        ],
        INGL_PROGRAM_ID
      );
      const [ingl_vote_data_account_key] = PublicKey.findProgramAddressSync(
        [Buffer.from(VOTE_DATA_ACCOUNT_KEY), vote_account_key.toBuffer()],
        INGL_PROGRAM_ID
      );
      const inglVoteAccount = await connection.getAccountInfo(
        ingl_vote_data_account_key
      );
      if (inglVoteAccount) {
        const inglVoteData = deserializeUnchecked(
          InglVoteAccountData,
          inglVoteAccount?.data as Buffer
        );
        votesIds.push({
          vote_account: vote_account_key,
          validator_id: new PublicKey(inglVoteData.validator_id),
        });
      }
    }
    return votesIds;
  } catch (error) {
    throw new Error('Failed to get Votes accounts with error: ' + error);
  }
}

export async function claimInglRewards(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  gems: { tokenMint: PublicKey; voteMint: PublicKey }[]
) {
  const {
    wallet: { publicKey: payerKey, sendTransaction, signTransaction },
    connection,
  } = walletConnection;

  const authorizeWithdrawerAccount: AccountMeta = {
    pubkey: authorized_withdrawer_key,
    isSigner: false,
    isWritable: true,
  };
  const systemProgramAccount: AccountMeta = {
    pubkey: SystemProgram.programId,
    isSigner: false,
    isWritable: false,
  };
  const payerAccount: AccountMeta = {
    pubkey: payerKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };
  const voteMints: PublicKey[] = [];
  gems.forEach(({ voteMint }) => {
    if (!voteMints.includes(voteMint)) {
      voteMints.push(voteMint);
    }
  });
  const claimRewardsInstructions: TransactionInstruction[] = [];
  for (let j = 0; j < voteMints.length; j++) {
    const voteMint = voteMints[j];

    const voteAccount: AccountMeta = {
      pubkey: voteMint,
      isSigner: false,
      isWritable: false,
    };

    const [ingl_vote_data_account_key] = PublicKey.findProgramAddressSync(
      [Buffer.from(VOTE_DATA_ACCOUNT_KEY), voteMint.toBuffer()],
      INGL_PROGRAM_ID
    );

    const ignlVoteDataAccount: AccountMeta = {
      pubkey: ingl_vote_data_account_key,
      isSigner: false,
      isWritable: false,
    };

    const inglVoteAccount = await connection.getAccountInfo(
      ingl_vote_data_account_key
    );
    const inglVoteData = deserializeUnchecked(
      InglVoteAccountData,
      inglVoteAccount?.data as Buffer
    );

    const validatorAccount: AccountMeta = {
      pubkey: new PublicKey(inglVoteData.validator_id),
      isSigner: false,
      isWritable: false,
    };

    const gemsAccounts: AccountMeta[] = [];
    const voteAccountGems = gems.filter(
      ({ voteMint }) => voteMint.toString() === voteAccount.pubkey.toString()
    );
    for (let i = 0; i < voteAccountGems.length; i++) {
      const { tokenMint } = voteAccountGems[i];

      const [gem_pubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
        INGL_PROGRAM_ID
      );

      const gemAccount: AccountMeta = {
        pubkey: gem_pubkey,
        isSigner: false,
        isWritable: true,
      };

      const mintAccount: AccountMeta = {
        pubkey: tokenMint,
        isSigner: false,
        isWritable: false,
      };
      const associatedTokenAccount: AccountMeta = {
        pubkey: await getAssociatedTokenAddress(
          mintAccount.pubkey,
          payerKey as PublicKey
        ),
        isSigner: false,
        isWritable: true,
      };
      gemsAccounts.push(associatedTokenAccount, mintAccount, gemAccount);
    }

    claimRewardsInstructions.push(
      new TransactionInstruction({
        programId: INGL_PROGRAM_ID,
        data: Buffer.from([
          Instruction.NFTWithdraw,
          ...uint32.getBytesBigEndian(voteAccountGems.length).reverse(),
        ]),
        keys: [
          payerAccount,
          voteAccount,
          validatorAccount,
          ignlVoteDataAccount,
          authorizeWithdrawerAccount,
          ...gemsAccounts,

          systemProgramAccount,
        ],
      })
    );
  }

  try {
    const transaction = new Transaction();
    const additionalComputeBudgetInstruction =
      ComputeBudgetProgram.requestUnits({
        units: 400_000,
        additionalFee: 0,
      });
    transaction.add(additionalComputeBudgetInstruction);
    transaction.feePayer = payerKey as PublicKey;
    claimRewardsInstructions.forEach((instruction) => {
      transaction.add(instruction);
    });

    const blockhashObj = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhashObj.blockhash;

    const signedTransaction = signTransaction
      ? await signTransaction(transaction)
      : null;

    const signature = await sendTransaction(
      signedTransaction as Transaction,
      connection
    );
    await connection.confirmTransaction({ ...blockhashObj, signature });
  } catch (error) {
    throw new Error('Failed to claim gems rewards  with error ' + error);
  }
}

export async function loadRewards(
  ownerPubkey: PublicKey,
  connection: Connection
) {
  try {
    const metaplex = new Metaplex(connection);
    const metaplexNft = metaplex.nfts();

    let lazyNfts = await metaplexNft.findAllByOwner(ownerPubkey).run();
    lazyNfts = lazyNfts.filter(
      ({ collection }) =>
        collection?.key.toString() === ingl_nft_collection_mint_key.toString()
    );
    const gemRewards: Gem[] = [];
    for (let i = 0; i < lazyNfts.length; i++) {
      const { json, mintAddress } = await metaplexNft
        .loadNft(lazyNfts[i] as LazyNft)
        .run();
      if (json) {
        const { image, attributes } = json;
        const [gem_pubkey] = PublicKey.findProgramAddressSync(
          [Buffer.from(GEM_ACCOUNT_CONST), mintAddress.toBuffer()],
          INGL_PROGRAM_ID
        );
        const accountInfo = await connection.getAccountInfo(gem_pubkey);
        const { funds_location, last_withdrawal_epoch, last_delegation_epoch } =
          deserializeUnchecked(GemAccountV0_0_1, accountInfo?.data as Buffer);
        const gemClass = attributes?.find(
          ({ trait_type }) => trait_type === 'Class'
        )?.value as NftClassToString;
        if (funds_location instanceof VoteAccountFundLocation) {
          const vote_account_key = new PublicKey(
            funds_location.vote_account_id
          );
          const [ingl_vote_data_account_key] = PublicKey.findProgramAddressSync(
            [Buffer.from(VOTE_DATA_ACCOUNT_KEY), vote_account_key.toBuffer()],
            INGL_PROGRAM_ID
          );
          const inglVoteAccount = await connection.getAccountInfo(
            ingl_vote_data_account_key
          );
          if (inglVoteAccount) {
            const inglVoteData = deserializeUnchecked(
              InglVoteAccountData,
              inglVoteAccount?.data as Buffer
            );
            const voteRewards = inglVoteData['vote_rewards'] as {
              epoch_number: BN;
              total_reward: BN;
              total_stake: BN;
            }[];
            const comp = last_delegation_epoch?.cmp(
              last_withdrawal_epoch as BN
            );
            const interestedEpoch =
              comp === 0
                ? last_delegation_epoch
                : comp === -1
                ? last_withdrawal_epoch
                : last_delegation_epoch;
            const interestedIndex =
              1 +
              voteRewards.findIndex(
                ({ epoch_number }) =>
                  epoch_number.cmp(interestedEpoch as BN) === 0
              );
            if (interestedIndex === 0) {
              gemRewards.push({
                image_ref: image as string,
                nft_id: mintAddress.toString(),
                vote_account_id: vote_account_key.toString(),
                rewards: 0,
              });
            } else {
              const totalRewards: number = voteRewards
                .slice(interestedIndex)
                .reduce((total, { total_reward, total_stake }, i) => {
                  return (total += Number(
                    (Number(total_reward.muln(NFTS_SHARE)) /
                      (100 * Number(total_stake))) *
                      inglGemSol[gemClass]
                  ));
                }, 0);
              gemRewards.push({
                image_ref: image as string,
                nft_id: mintAddress.toString(),
                vote_account_id: vote_account_key.toString(),
                rewards: Number(totalRewards.toString(10)),
              });
            }
          }
        }
      }
    }
    return gemRewards;
  } catch (error) {
    throw new Error('Failed to load gems rewards  with error ' + error);
  }
}
