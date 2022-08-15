import { Box, Skeleton, Typography } from '@mui/material';
import React from 'react';
import { InglSummary } from '.';
import shortenNumber from '../../common/utils/shortenNumber';
import theme from '../../theme/theme';

export default function InglNumber({
  data: { displayTitle, amount },
  isDataLoading,
}: {
  data: InglSummary;
  isDataLoading: boolean;
}) {
  return (
    <Box
      sx={{
        backgroundColor: '#092C4C88',
        borderRadius: theme.spacing(3),
        padding: theme.spacing(2),
      }}
    >
      <Typography sx={{ textAlign: 'center' }}>{displayTitle}</Typography>
      {isDataLoading ? (
        <Skeleton
          variant="text"
          sx={{ backgroundColor: 'rgba(177,177,177,0.17)' }}
        />
      ) : (
        <Typography
          sx={{ fontWeight: 'bold', fontSize: '4rem', textAlign: 'center' }}
        >
          {shortenNumber(amount)}
        </Typography>
      )}
    </Box>
  );
}
