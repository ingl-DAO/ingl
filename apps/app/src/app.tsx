import theme from './theme/theme';
import { ThemeProvider } from '@mui/material/styles';
import { useLanguage } from './contexts/language/LanguageContextProvider';
import frMessages from './languages/fr';
import enMessages from './languages/en-us';
import { IntlProvider } from 'react-intl';
import { useRoutes } from 'react-router';
import { routes } from './routes/routes';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, Flip } from 'react-toastify';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  ConnectionProvider,
  useWallet,
  WalletContextState,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { useEffect, useMemo, useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import {
  createDefaultAuthorizationResultCache,
  SolanaMobileWalletAdapter,
} from '@solana-mobile/wallet-adapter-mobile';
import {
  CoinbaseWalletAdapter,
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  Backend,
  Config,
  defaultVariables,
  DialectContextProvider,
  DialectThemeProvider,
  DialectUiManagementProvider,
  DialectWalletAdapter,
  IncomingThemeVariables,
} from '@dialectlabs/react-ui';
require('@dialectlabs/react-ui/index.css');
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

// Dialect needs the connected wallet information from your wallet adapter,
// wrapping in a separate component for composition

export const themeVariables: IncomingThemeVariables = {
  dark: {
    bellButton:
      'w-10 h-10 shadow-xl shadow-neutral-800 border border-neutral-600 hover:shadow-neutral-700 bg-white',
    modal: `${defaultVariables.dark.modal} sm:rounded-3xl sm:border border-[#383838]/40 bg-[#141414]`, // 0.4 opacity based on trial-and-error
  },
  animations: {
    popup: {
      enter: 'transition-all duration-300 origin-top-right',
      enterFrom: 'opacity-0 scale-75',
      enterTo: 'opacity-100 scale-100',
      leave: 'transition-all duration-100 origin-top-right',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-75',
    },
  },
};

const DIALECT_PUBLIC_KEY = new PublicKey(
  'BKi63mkq3XmQMLXc92NhVmKYc25sbbaKqZHpRcg1xUas'
);

// TODO: move this to react-sdk and export
const walletToDialectWallet = (
  wallet: WalletContextState
): DialectWalletAdapter => ({
  publicKey: wallet.publicKey!,
  connected:
    wallet.connected &&
    !wallet.connecting &&
    !wallet.disconnecting &&
    Boolean(wallet.publicKey),
  signMessage: wallet.signMessage,
  signTransaction: wallet.signTransaction,
  signAllTransactions: wallet.signAllTransactions,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  diffieHellman: wallet.wallet?.adapter?._wallet?.diffieHellman
    ? async (pubKey) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        return wallet.wallet?.adapter?._wallet?.diffieHellman(pubKey);
      }
    : undefined,
});

const DialectProviders = (props: any) => {
  const wallet = useWallet();
  // We need to create an adapter for Dialect to support any type of wallet
  // `convertWalletForDialect` is a function that needs to be implemented to convert `WalletContextState` to `DialectWalletAdapter` type.
  // Please navigate to any example in `examples` folder and find an example implementation there.
  const [dialectWalletAdapter, setDialectWalletAdapter] =
    useState<DialectWalletAdapter>(() => walletToDialectWallet(wallet));

  useEffect(() => {
    setDialectWalletAdapter(walletToDialectWallet(wallet));
  }, [wallet]);

  // Basic configuration for dialect. Target mainnet-beta and dialect cloud production environment
  const dialectConfig = useMemo(
    (): Config => ({
      backends: [Backend.DialectCloud],
      environment: 'production',
      dialectCloud: {
        tokenStore: 'local-storage',
      },
    }),
    []
  );
  return (
    // We are missing some props for now, we will add them in the next step
    <DialectContextProvider
      wallet={dialectWalletAdapter}
      config={dialectConfig}
      dapp={DIALECT_PUBLIC_KEY}
      gate={() =>
        new Promise((resolve) => setTimeout(() => resolve(true), 2000))
      }
    >
      <DialectThemeProvider theme={'dark'} variables={themeVariables}>
        <DialectUiManagementProvider>
          {props.children}
        </DialectUiManagementProvider>
      </DialectThemeProvider>
    </DialectContextProvider>
  );
};

export function App() {
  const { activeLanguage } = useLanguage();
  const activeMessage = activeLanguage === 'en' ? frMessages : enMessages;
  const routing = useRoutes(routes);

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolanaMobileWalletAdapter({
        cluster: network,
        appIdentity: { name: 'Solana Wallet Adapter App' },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
      }),
      new CoinbaseWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* <DialectProviders> */}
          <IntlProvider
            messages={activeMessage}
            locale={activeLanguage}
            defaultLocale="en"
          >
            <ThemeProvider theme={theme}>
              <ToastContainer
                position="top-left"
                autoClose={5000}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                transition={Flip}
              />
              <DialectProviders>{routing}</DialectProviders>
            </ThemeProvider>
          </IntlProvider>
          {/* </DialectProviders> */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
