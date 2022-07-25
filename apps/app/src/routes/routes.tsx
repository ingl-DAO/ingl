import { Navigate } from 'react-router';
import Layout from '../components/layout';
import Test from '../components/Test';

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/nft" /> },
      { path: '/nft', element: <Test /> },
      { path: '*', element: <Navigate to="/" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" /> },
];
