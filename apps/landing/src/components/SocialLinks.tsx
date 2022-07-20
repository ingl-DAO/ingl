import { Box, Typography } from '@mui/material';
import theme from '../theme/theme';
import Links from './Links';

export default function SocialLinks() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: theme.spacing(2),
        alignItems: 'center',
        marginTop: { mobile: theme.spacing(3.5), laptop: theme.spacing(3) },
        marginBottom: {
          mobile: theme.spacing(0),
          laptop: theme.spacing(10.11),
        },
      }}
    >
      <Typography variant="body2">Follow us on</Typography>
      <Links />
    </Box>
  );
}
