import {
  DialectSdk,
  Backend,
  ConfigProps,
  Dialect,
  DialectWalletAdapterWrapper,
  EncryptionKeysStore,
  NodeDialectWalletAdapter,
  TokenStore,
  Dapp,
} from '@dialectlabs/sdk';
import { Keypair } from '@solana/web3.js';

export function createSdk(): DialectSdk {
  const keypair = Buffer.from(
    JSON.parse(process.env['NX_DIALECT_KEYPAIR'] as string)
  );
  const secretKey = Keypair.fromSecretKey(keypair);

  const backends = [Backend.DialectCloud, Backend.Solana];
  const dialectCloud = {
    url: 'https://dialectapi.to',
    tokenStore: TokenStore.createInMemory(),
  };
  const environment = 'production';
  const encryptionKeysStore = EncryptionKeysStore.createInMemory();
  const solana = {
    rpcUrl: 'https://api.devnet.solana.com',
  };
  // const keypair = Keypair.fromSecretKey(secretKey);
  const wallet = DialectWalletAdapterWrapper.create(
    NodeDialectWalletAdapter.create(secretKey)
  );

  const sdk: DialectSdk = Dialect.sdk({
    backends,
    dialectCloud,
    environment,
    encryptionKeysStore,
    solana,
    wallet,
  } as ConfigProps);

  return sdk;
}

export async function createDapp(): Promise<Dapp> {
  const sdk = createSdk();
  let dapp = await sdk.dapps.find();
  if (!dapp) {
    dapp = await sdk.dapps.create({
      name: 'Ingl Dapp',
      description: 'Ingl events notifications dapp',
    });
  }
  return dapp;
}

export async function broadcastEvent(title: string, message: string) {
  const dapp = await createDapp();
  await dapp.messages.send({
    title,
    message,
  });
}
