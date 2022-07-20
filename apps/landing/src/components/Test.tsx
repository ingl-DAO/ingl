import { Box, CssBaseline, Typography } from '@mui/material';
import { injectIntl, IntlShape } from 'react-intl';
import theme from '../theme/theme';
import DaoSection from './DaoSection';
import Faqs from './Faqs';
import Footer from './Footer';
import HeroSection from './HeroSection';
import Navbar from './Navbar';
import SectionCard from './SectionCard';
import SectionTitle from './SectionTitle';
import SocialLinks from './SocialLinks';
import Team from './Team';

export function Test({ intl: { formatMessage } }: { intl: IntlShape }) {
  return (
    <>
      {/* <CssBaseline /> */}
      <>
        <Box sx={{ px: theme.spacing(8), py: theme.spacing(2.375) }}>
          <Navbar />
          <HeroSection />
          <SocialLinks />
          <SectionCard />
          <DaoSection />
          <Team />
          <Faqs />
          {/* <SectionTitle title="hello world Sacre workd" /> */}
          {/* <Typography variant="h1" color="secondary" sx={{ marginTop: 12.3 }}>
          {formatMessage({ id: 'welcomeText' })}
        </Typography> */}
        </Box>
        <Footer />
      </>
    </>
  );
}
export default injectIntl(Test);
