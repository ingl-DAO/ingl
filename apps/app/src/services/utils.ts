import { WalletContextState } from '@solana/wallet-adapter-react';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export const toBytesInt32 = (num: number) => {
  const arr = new Uint8Array([
    (num & 0xff000000) >> 24,
    (num & 0x00ff0000) >> 16,
    (num & 0x0000ff00) >> 8,
    num & 0x000000ff,
  ]);
  return arr;
};

export const signAndConfirmTransaction = async (
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
