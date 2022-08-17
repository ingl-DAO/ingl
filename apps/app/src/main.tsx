import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app';
import LanguageContextProvider from './contexts/language/LanguageContextProvider';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <LanguageContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageContextProvider>
  </StrictMode>
);
