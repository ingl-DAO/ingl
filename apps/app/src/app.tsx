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

export function App() {
  const { activeLanguage } = useLanguage();
  const activeMessage = activeLanguage === 'en' ? frMessages : enMessages;
  const routing = useRoutes(routes);

  return (
    <IntlProvider
      messages={activeMessage}
      locale={activeLanguage}
      defaultLocale="en"
    >
      <ThemeProvider theme={theme}>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          transition={Flip}
        />
        {routing}
      </ThemeProvider>
    </IntlProvider>
  );
}

export default App;
