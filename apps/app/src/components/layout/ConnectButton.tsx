import { Box } from '@mui/material';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import theme from '../../theme/theme';

export default function ConnectButton({
  isSideNavElement,
}: {
  isSideNavElement?: boolean;
}) {
  return (
    <Box
      sx={{
        display: {
          laptop: isSideNavElement ? 'none' : 'initial',
          mobile: isSideNavElement ? 'grid' : 'none',
        },
        justifyContent: 'center',
        '& .wallet-adapter-button-trigger': {
          backgroundColor: 'transparent',
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: '90px',
        },
      }}
    >
      <WalletMultiButton />
    </Box>
  );
}
