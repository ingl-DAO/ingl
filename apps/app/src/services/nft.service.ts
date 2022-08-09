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
  decodeInglData,
  PD_POOL_KEY,
  VOTE_DATA_ACCOUNT_KEY,
} from './state';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  AccountMeta,
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
import { inglGem } from '../components/nftDisplay';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

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

const signAndConfirmTransaction = async (
  walletConnection: { connection: Connection; wallet: WalletContextState },
  instruction: TransactionInstruction,
  signingKeypair?: Keypair
) => {
  const {
    connection,
    wallet: { publicKey: payerKey, sendTransaction, signTransaction },
  } = walletConnection;

  const transaction = new Transaction();
  transaction.add(instruction).feePayer = payerKey as PublicKey;

  const blockhashObj = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhashObj.blockhash;

  if (signingKeypair) transaction.sign(...[signingKeypair]);
  const signedTransaction = signTransaction
    ? await signTransaction(transaction)
    : null;

  const signature = await sendTransaction(
    signedTransaction as Transaction,
    connection
  );
  await connection.confirmTransaction({ ...blockhashObj, signature });
};

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
      mintKeyPair
    );
  } catch (error) {
    throw new Error(
      'Collection Minting transaction failed with error ' + error
    );
  }
}

export async function imprintRarity(
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

const getInglGemFromNft = async (connection: Connection, nft: Nft) => {
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
    const decodedData = await decodeInglData(
      GemAccountV0_0_1,
      accountInfo?.data as Buffer
    );
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
      rarity: decodedData['rarity'],
      is_allocated: decodedData['funds_location']['enum'] === 'pDPool',
      is_delegated: decodedData['funds_location']['enum'] === 'voteAccount',
      allocation_date: decodedData['date_allocated'],
      rarity_reveal_date: decodedData['rarity_seed_time'],
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
        collection &&
        collection.key.toString() === ingl_nft_collection_mint_key.toString()
    );
    const myInglGems: inglGem[] = [];
    for (let i = 0; i < lazyNfts.length; i++) {
      const inglNft = await metaplexNft.loadNft(lazyNfts[i] as LazyNft).run();
      myInglGems.push(await getInglGemFromNft(connection, inglNft));
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

export async function delegateNft(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  tokenMint: PublicKey
) {
  const {
    wallet: { publicKey: payerKey },
  } = walletConnection;

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

  const vote_account_key = Keypair.generate();
  const voteAccount: AccountMeta = {
    pubkey: vote_account_key.publicKey,
    isSigner: false,
    isWritable: false,
  };

  const [ignl_vote_data_account_key] = PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_DATA_ACCOUNT_KEY), vote_account_key.publicKey.toBuffer()],
    INGL_PROGRAM_ID
  );

  const ignlVoteDataAccount: AccountMeta = {
    pubkey: ignl_vote_data_account_key,
    isSigner: false,
    isWritable: false,
  };
  const [stake_account_key] = PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_DATA_ACCOUNT_KEY), vote_account_key.publicKey.toBuffer()],
    INGL_PROGRAM_ID
  );
  const stakeAccount: AccountMeta = {
    pubkey: stake_account_key,
    isSigner: false,
    isWritable: false,
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

  const delegateSolInstruction = new TransactionInstruction({
    programId: INGL_PROGRAM_ID,
    data: Buffer.from([Instruction.DelegateSol]),
    keys: [
      payerAccount,
      pDPoolAccount,
      voteAccount,
      ignlVoteDataAccount,
      stakeAccount,
      mintAccount,
      gemAccount,
      associatedTokenAccount,
      globalGemAccount,
      sysvarClockAccount,
      stakeConfigProgramAccount,

      systemProgramAccount,
    ],
  });

  try {
    await signAndConfirmTransaction(walletConnection, delegateSolInstruction);
  } catch (error) {
    throw new Error('Failed to deallocate gem sol with error ' + error);
  }
}

// export async function undelegateNft(
//   walletConnection: { connection: Connection; wallet: WalletContextState },
//   tokenMint: PublicKey
// ) {

// }
