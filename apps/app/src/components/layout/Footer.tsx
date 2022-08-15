import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import Links from './Links';

export default function Footer() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        justifyItems: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        padding: '3px 0',
        width: '100vw',
        // px: { laptop: theme.spacing(8), mobile: '10px' },
      }}
    >
      <Link to={'/'} style={{ textDecoration: 'none' }}>
        <Typography
          variant="h1"
          sx={{ fontSize: '1.125rem' }}
          color="secondary"
        >
          ingl.io
        </Typography>
      </Link>
      <Typography variant="caption" sx={{ color: 'white' }}>
        Copyright &copy; {`${new Date().getFullYear()}`}
      </Typography>
      <Links />
    </Box>
  );
}
