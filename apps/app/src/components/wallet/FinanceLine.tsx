import { Box, Typography } from '@mui/material';
import React from 'react';
import theme from '../../theme/theme';

export default function FinanceLine({
  lineTitle,
  amount,
}: {
  lineTitle: string;
  amount: number;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: theme.spacing(2),
        marginTop: theme.spacing(2)
      }}
    >
      <Typography variant="h2" sx={{ fontSize: '2rem' }}>
        {lineTitle}
      </Typography>
      <Typography
        variant="h2"
        sx={{ color: theme.palette.secondary.main, fontSize: '2rem' }}
      >{`${amount} SOL`}</Typography>
    </Box>
  );
}
