import { Box, Typography, useTheme } from '@mui/material';
import { inglGem } from './VoteDialog';

export default function DaoGem({
  isSelected,
  isUnusable,
  nft,
  selectGem,
}: {
  isSelected: boolean;
  isUnusable: boolean;
  nft: inglGem;
  selectGem: () => void;
}) {
  const theme = useTheme();
  return (
    <Box
      onClick={() => (isUnusable ? null : selectGem())}
      sx={{
        position: 'relative',
        height: '200px',
        width: '200px',
        cursor: 'pointer',
        display: 'flex',
        alignContent: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={nft.image_ref}
        height="200px"
        alt="nft"
        width="200px"
        style={{ borderRadius: '14px' }}
      />
      {(isUnusable || isSelected) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: isSelected
              ? theme.palette.secondary.main + '44'
              : 'rgba(9, 44, 76, 0.6)',
            height: '200px',
            width: '200px',
            display: 'grid',
            alignContent: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography>
            {isUnusable ? 'Already used' : isSelected ? 'Selected' : null}
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute',
          backgroundColor: theme.palette.primary.dark,
          padding: '5px 7px',
          borderRadius: '30px',
          bottom: 0,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { laptop: 'initial', mobile: '0.80rem' },
            textAlign: 'center',
            color: theme.palette.secondary.main,
          }}
        >
          {`#${nft.numeration}`}
        </Typography>
      </Box>
    </Box>
  );
}
