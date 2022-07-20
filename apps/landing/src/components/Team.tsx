import { Box, Grid, Typography } from '@mui/material';
import React from 'react';
import theme from '../theme/theme';
import UserCard from './UserCard';

export interface Member {
  imageRef: string;
  twitterRef: string;
  gitRef: string;
  role: string;
  fullname: string;
}

export default function Team() {
  const members: Member[] = [
    {
      fullname: 'John Doe',
      role: 'CEO',
      gitRef: 'https://gitlab.com/inglproject/ingl',
      twitterRef: 'https://twitter.com',
      imageRef:
        'https://th.bing.com/th/id/R.304026e0e6ec56cf5be113f97e40ddbf?rik=nE6Kvw6%2biZQRKw&pid=ImgRaw&r=0',
    },
    {
      fullname: 'John Doe',
      role: 'CEO',
      gitRef: 'https://gitlab.com/inglproject/ingl',
      twitterRef: 'https://twitter.com',
      imageRef:
        'https://th.bing.com/th/id/R.304026e0e6ec56cf5be113f97e40ddbf?rik=nE6Kvw6%2biZQRKw&pid=ImgRaw&r=0',
    },
    {
      fullname: 'John Doe',
      role: 'CEO',
      gitRef: 'https://gitlab.com/inglproject/ingl',
      twitterRef: 'https://twitter.com',
      imageRef:
        'https://th.bing.com/th/id/R.304026e0e6ec56cf5be113f97e40ddbf?rik=nE6Kvw6%2biZQRKw&pid=ImgRaw&r=0',
    },
    {
      fullname: 'John Doe',
      role: 'CEO',
      gitRef: 'https://gitlab.com/inglproject/ingl',
      twitterRef: 'https://twitter.com',
      imageRef:
        'https://th.bing.com/th/id/R.304026e0e6ec56cf5be113f97e40ddbf?rik=nE6Kvw6%2biZQRKw&pid=ImgRaw&r=0',
    },
  ];
  return (
    <Box
      sx={{
        textAlign: 'center',
        marginTop: { laptop: theme.spacing(10), mobile: theme.spacing(6) },
        marginBottom: { laptop: theme.spacing(10), mobile: theme.spacing(6) },
      }}
    >
      <Typography
        variant="h1"
        component="span"
        sx={{
          color: 'white',
          fontSize: { mobile: '2rem', laptop: '3.125rem' },
        }}
      >
        BROUGHT TO YOU BY
      </Typography>
      <Box
        sx={{
          display: 'grid',
          marginTop:{laptop:theme.spacing(17), mobile: theme.spacing(5)},
          gridTemplateColumns: {
            mobile: 'auto',
            laptop: 'auto auto auto auto',
          },
          rowGap: theme.spacing(3.75),
          columnGap: theme.spacing(5.75),
        }}
      >
        {members.map((member, index) => (
          <UserCard member={member} key={index} />
        ))}
      </Box>
    </Box>
  );
}
