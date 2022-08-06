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
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PROGRAM_ID as METAPLEX_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { LazyNft, Metaplex, Nft } from '@metaplex-foundation/js';
import { inglGem } from '../components/nftDisplay';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

export async function mintInglGem(
  walletConnection: { connection: Connection; wallet: WalletContextState },
  nftClass: NftClass
) {
  const {
    connection,
    wallet: { publicKey, sendTransaction, signTransaction },
  } = walletConnection;
  if (!publicKey) throw new Error('Please connect your wallet');

  const payerAccount: AccountMeta = {
    pubkey: publicKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };

  const mintKeyPair = Keypair.generate();
  const mintAccount: AccountMeta = {
    pubkey: mintKeyPair.publicKey,
    isSigner: true,
    isWritable: true,
  };

  const [mint_authority] = await PublicKey.findProgramAddress(
    [Buffer.from(INGL_MINT_AUTHORITY_KEY)],
    INGL_PROGRAM_ID
  );

  const mintAuthorityAccount: AccountMeta = {
    pubkey: mint_authority,
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

  const [global_gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_GEM_KEY)],
    INGL_PROGRAM_ID
  );

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

  const [miting_pool_key] = await PublicKey.findProgramAddress(
    [Buffer.from(INGL_MINTING_POOL_KEY)],
    INGL_PROGRAM_ID
  );
  const mintingPoolAccount: AccountMeta = {
    pubkey: miting_pool_key,
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

  const [ingl_nft_collection_key] = PublicKey.findProgramAddressSync(
    [Buffer.from(INGL_NFT_COLLECTION_KEY)],
    INGL_PROGRAM_ID
  );
  const inglNftCollectionMintAccount: AccountMeta = {
    pubkey: ingl_nft_collection_key,
    isSigner: false,
    isWritable: false,
  };

  const [ingl_nft_collection_metadata_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      ingl_nft_collection_key.toBuffer(),
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
      ingl_nft_collection_key.toBuffer(),
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
    const transaction = new Transaction();

    transaction.add(mintNftInstruction).feePayer = publicKey as PublicKey;

    const blockhashObj = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhashObj.blockhash;

    transaction.sign(...[mintKeyPair]);
    const signedTransaction = signTransaction
      ? await signTransaction(transaction)
      : null;

    const signature = await sendTransaction(
      signedTransaction as Transaction,
      connection
    );
    console.log('Hello world');
    return await connection.confirmTransaction({ ...blockhashObj, signature });
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
    connection,
    wallet: { publicKey, sendTransaction, signTransaction },
  } = walletConnection;
  if (!publicKey) throw new WalletNotConnectedError();

  const payerAccount: AccountMeta = {
    pubkey: publicKey as PublicKey,
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

  const execute = async (instruction: TransactionInstruction) => {
    const transaction = new Transaction();
    transaction.add(instruction).feePayer = publicKey as PublicKey;

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
  };

  try {
    await execute(initRarityImprintIntrustion);

    await new Promise((resolve, reject) =>
      setTimeout(async () => {
        try {
          const transactionId = await execute(imprintRarityInstruction);
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
    connection,
    wallet: { publicKey, sendTransaction, signTransaction },
  } = walletConnection;
  if (!publicKey) throw new WalletNotConnectedError();

  const payerAccount: AccountMeta = {
    pubkey: publicKey as PublicKey,
    isSigner: true,
    isWritable: true,
  };

  const mintAccount: AccountMeta = {
    pubkey: tokenMint,
    isSigner: false,
    isWritable: true,
  };
  const [mitingPoolKey] = await PublicKey.findProgramAddress(
    [Buffer.from(INGL_MINTING_POOL_KEY)],
    INGL_PROGRAM_ID
  );

  const mintingPoolAccount: AccountMeta = {
    pubkey: mitingPoolKey,
    isSigner: false,
    isWritable: true,
  };

  const associatedTokenAccount: AccountMeta = {
    pubkey: await getAssociatedTokenAddress(tokenMint, payerAccount.pubkey),
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

  const [gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GEM_ACCOUNT_CONST), tokenMint.toBuffer()],
    INGL_PROGRAM_ID
  );
  const gemAccount: AccountMeta = {
    pubkey: gem_pubkey,
    isSigner: false,
    isWritable: true,
  };

  const [ingl_nft_collection_mint_key] = PublicKey.findProgramAddressSync(
    [Buffer.from(INGL_NFT_COLLECTION_KEY)],
    INGL_PROGRAM_ID
  );

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

  const [ingl_nft_collection_key] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METAPLEX_PROGRAM_ID.toBuffer(),
      ingl_nft_collection_mint_key.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );
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

  const [program_treasury_id] = PublicKey.findProgramAddressSync(
    [Buffer.from(INGL_TREASURY_ACCOUNT_KEY)],
    INGL_PROGRAM_ID
  );
  const programTreasuryAccount: AccountMeta = {
    pubkey: program_treasury_id,
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

  const redeemNftInstruction = new TransactionInstruction({
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
    const transaction = new Transaction();
    transaction.add(redeemNftInstruction).feePayer = publicKey as PublicKey;

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
    throw new Error('Failed to imprint rarity with error ' + error);
  }
}

const [ingl_nft_collection_mint_key] = PublicKey.findProgramAddressSync(
  [Buffer.from(INGL_NFT_COLLECTION_KEY)],
  INGL_PROGRAM_ID
);

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
      const [gem_pubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(GEM_ACCOUNT_CONST), inglNft.mintAddress.toBuffer()],
        INGL_PROGRAM_ID
      );
      const accountInfo = await connection.getAccountInfo(gem_pubkey);
      const decodedData = await decodeInglData(
        GemAccountV0_0_1,
        accountInfo?.data as Buffer
      );
      myInglGems.push({
        ...getInglGemFromNft(inglNft),
        is_allocated: decodedData['funds_location']['enum'] === 'pDPool',
        is_delegated: decodedData['funds_location']['enum'] === 'voteAccount',
        allocation_date: decodedData['date_allocated'],
        rarity_reveal_date: decodedData['rarity_seed_time'],
      });
    }
    console.log(myInglGems);
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
    return getInglGemFromNft(inglNft);
  } catch (error) {
    throw new Error('Failed to load by mint with error ' + error);
  }
}

const getInglGemFromNft = (nft: Nft) => {
  const {
    mint: { address },
    json,
  } = nft;
  if (json) {
    const { attributes, image, properties } = json;
    return {
      image_ref: image,
      generation: Number(
        attributes?.find(({ trait_type }) => trait_type === 'Generation')?.value
      ),
      nft_id: address.toString(),
      gemClass: attributes?.find(({ trait_type }) => trait_type === 'Class')
        ?.value,
      has_loan: false,
      is_allocated: false,
      is_delegated: false,
      video_ref: properties?.files?.find((file) => file.type === 'video/mp4')
        ?.uri,
    };
  }
  throw new Error('No json fields was found on metadata');
};
