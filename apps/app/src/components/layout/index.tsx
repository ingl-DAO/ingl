import { Box } from '@mui/material';
import Scrollbars from 'rc-scrollbars';
import { Outlet } from 'react-router';
import theme from '../../theme/theme';
import Footer from './Footer';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        height: '100vh',
      }}
    >
      <Navbar />
      <Box sx={{ height: '100%', px: theme.spacing(8) }}>
        <Box
          sx={{
            // border: `5px solid ${theme.palette.primary.main}`,
            // borderTopLeftRadius: '30px',
            // borderTopRightRadius: '30px',
            // borderBottom: '0px',
            height: '100%',
            // px: theme.spacing(10),
          }}
        >
          <Scrollbars
            autoHide
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            <Outlet />
          </Scrollbars>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
