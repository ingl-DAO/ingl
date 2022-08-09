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
  GlobalGems,
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

export const getProposals = async (connection: Connection) => {
  const [global_gem_pubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_GEM_KEY)],
    INGL_PROGRAM_ID
  );

  const globalGemAccountInfo = await connection.getAccountInfo(
    global_gem_pubkey
  );
  const decodedData = await decodeInglData(
    GlobalGems,
    globalGemAccountInfo?.data as Buffer
  );

  console.log('Global gems data: ', decodedData);
};
