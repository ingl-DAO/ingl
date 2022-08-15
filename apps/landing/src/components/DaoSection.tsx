import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import theme from '../theme/theme';
import SectionTitle from './SectionTitle';
import BG from '../assets/dao_bg.png';

export default function DaoSection() {
  return (
    <Box
      sx={{
        textAlign: 'center',
        marginTop: theme.spacing(17.625),
        position: 'relative',
      }}
    >
      <Box sx={{ width: { laptop: 'initial', mobile: '100%' } }}>
        <img
          src={BG}
          alt="dao over world"
          style={{
            position: 'absolute',
            top: -330,
            left: -75,
            zIndex: -1,
            width: 'inherit',
          }}
        />
      </Box>
      <SectionTitle title="dao powered community" center />
      <Typography sx={{ mx: { laptop: 25, mobile: 0 } }}>
        ingl DAO is a fully decentralised and DAO controlled protocol.
        Everything ranging from program upgrade to onboarded validators is a
        communal decision. The base governance units are ingl gems and the
        council is made up of onboarded validators.
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        component="a"
        href="https://app.ingl.io/"
        rel="noreferrer"
        target="_blank"
        sx={{ borderRadius: '90px', marginTop: theme.spacing(11) }}
      >
        Join
      </Button>
    </Box>
  );
}
