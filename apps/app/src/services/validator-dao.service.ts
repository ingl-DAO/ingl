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
  PROPOSAL_KEY,
  ValidatorProposal,
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
import { deserialize, deserializeUnchecked } from '@dao-xyz/borsh';
import axios from 'axios';

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

const toBytesInt32 = (num: number) => {
  const arr = new Uint8Array([
    (num & 0xff000000) >> 24,
    (num & 0x00ff0000) >> 16,
    (num & 0x0000ff00) >> 8,
    num & 0x000000ff,
  ]);
  return arr;
};

const promiseAll = async (promiseData: any) => {
  const filteredPromiseData: any = [];
  const getTokenData = await Promise.allSettled(promiseData);
  await getTokenData.forEach((tokenD) => {
    if (tokenD?.status === 'fulfilled' && tokenD.value) {
      filteredPromiseData.push(tokenD.value);
    }

    return false;
  });
  return filteredPromiseData;
};

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

export const getGlobalGemData = async (connection: Connection) => {
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

  return {
    counter: decodedData['counter'],
    total_raised: Number(decodedData['total_raised']),
    pd_pool_total: Number(decodedData['pd_pool_total']),
    delegated_total: Number(decodedData['delegated_total']),
    dealloced_total: Number(decodedData['dealloced_total']),
    proposal_numeration: decodedData['proposal_numeration'],
    is_proposal_ongoing: decodedData['is_proposal_ongoing'],
    validator_list: decodedData['validator_list'],
  };
};

export const getProposalsData = async (connection: Connection) => {
  const proposalsCounter = await (
    await getGlobalGemData(connection)
  ).proposal_numeration;

  let proposalsPDAPromise = [];

  for (let i = 0; i < proposalsCounter; i++) {
    const promise = new Promise((resolve, reject) => {
      try {
        (async () => {
          const [proposal_pubkey] = await PublicKey.findProgramAddress(
            [Buffer.from(PROPOSAL_KEY), toBytesInt32(i)],
            INGL_PROGRAM_ID
          );
          resolve(proposal_pubkey);
        })();
      } catch (error) {
        reject(error);
      }
    });
    proposalsPDAPromise.push(promise);
  }

  proposalsPDAPromise = await promiseAll(proposalsPDAPromise);

  let proposalsInfo = proposalsPDAPromise.map(
    (proposal_pubkey: PublicKey) =>
      new Promise((resolve, reject) => {
        (async () => {
          const proposalInfo = await connection.getAccountInfo(proposal_pubkey);
          if (!proposalInfo?.data) {
            // if data null, token is not what we expect, delete it
            reject(false);
          } else {
            resolve({
              proposal_pubkey: proposal_pubkey,
              data: proposalInfo?.data,
            });
          }
        })();
      })
  );

  proposalsInfo = await promiseAll(proposalsInfo);
  const decodedData = [];
  for (let i = 0; i < proposalsInfo.length; i++) {
    const element = proposalsInfo[i];
    const value = element?.data;
    // deserialize buffer data into readable format
    const data = deserializeUnchecked(ValidatorProposal, value);
    decodedData.push({ proposal_pubkey: element?.proposal_pubkey, data: data });
  }

  return decodedData;
};

export const getValidatorsDetail = async () => {
  const token = '2N5SY2eQVFZJWu6LiRbY1m9X';
  const validatorsList = await fetch(
    'https://www.validators.app/api/v1/validators/testnet.json',
    {
      headers: {
        token,
      },
    }
  );

  return validatorsList;
};
