import { Navigate } from 'react-router';
import Test from '../components/Test';

export const routes = [
  {
    path: '/',
    element: <Test />,
  },
  { path: '*', element: <Navigate to="/" /> },
];
