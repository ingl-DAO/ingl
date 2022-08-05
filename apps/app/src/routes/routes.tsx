import { Navigate } from 'react-router';
import Layout from '../components/layout';
import NftDisplay from '../components/nftDisplay';
import Wallet from '../components/wallet';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/nft" /> },
      { path: '/nft', element: <NftDisplay /> },
      { path: '/wallet', element: <Wallet /> },
      { path: '*', element: <Navigate to="/" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" /> },
];
