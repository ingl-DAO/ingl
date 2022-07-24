import { Box } from '@mui/material';
import { injectIntl, IntlShape } from 'react-intl';
import theme from '../theme/theme';
import DaoSection from './DaoSection';
import Faqs from './Faqs';
import Footer from './Footer';
import HeroSection from './HeroSection';
import Navbar from './Navbar';
import SectionCard from './SectionCard';
import SocialLinks from './SocialLinks';
import Team from './Team';

export function Test({ intl: { formatMessage } }: { intl: IntlShape }) {
  return (
    <Box sx={{ display: 'grid', justifyItems: 'center', minHeight: '100vh' }}>
      <Box
        sx={{
          px: theme.spacing(8),
          py: theme.spacing(2.375),
          maxWidth: theme.spacing(190),
        }}
      >
        <Navbar />
        <HeroSection />
        <SocialLinks />
        <SectionCard />
        <DaoSection />
        <Team />
        <Faqs />
      </Box>
      <Footer />
    </Box>
  );
}
export default injectIntl(Test);
