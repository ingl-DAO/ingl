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
      <Box sx={{width: {laptop: 'initial', mobile: '100%'}}}>
        <img
          src={BG}
          alt="dao over world"
          style={{
            position: 'absolute',
            top: -330,
            left: -75,
            zIndex: -1,
            width: 'inherit'
          }}
        />
      </Box>
      <SectionTitle title="dao powered community" center />
      <Typography sx={{ mx: { laptop: 25, mobile: 0 } }}>
        Lorem ipsum s simply dummy text of the printing and typesetting
        industry. Lo Lorem Ipsum has been the industry's standard dummy text
        ever since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        component="a"
        href='https://app.ingl.io/mint'
        rel="noreferrer"
        target="_blank"  
        sx={{ borderRadius: '90px', marginTop: theme.spacing(11) }}
      >
        Join now
      </Button>
    </Box>
  );
}
