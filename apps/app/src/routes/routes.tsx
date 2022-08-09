import { Navigate } from 'react-router';
import Dao from '../components/dao';
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
      { path: '/dao', element: <Dao /> },
      { path: '*', element: <Navigate to="/" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" /> },
];
