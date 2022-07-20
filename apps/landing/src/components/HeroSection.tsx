import { Box, Button, Grid, Typography } from '@mui/material';
import Hero from '../assets/Hero.png';
import theme from '../theme/theme';

export default function HeroSection() {
  return (
    <Grid container spacing={4.5} sx={{ marginTop: 12.3 }}>
      <Grid item container mobile={12} laptop={6.5} alignContent="center">
        <Grid item mobile={12} sx={{textAlign:'justify'}}>
          <Typography
            variant="h1"
            sx={{
              color: 'white',
              textAlign: 'justify',
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
            }}
            component="span"
          >
            Bring Solana
          </Typography>
          <Typography
            variant="h1"
            component="span"
            sx={{
              background:
                'linear-gradient(90deg, #003566 31.09%, #02C39A 73.96%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
            }}
          >
            {' '}
            Validators
          </Typography>
          <Typography
            variant="h1"
            component="span"
            sx={{
              color: 'white',
              textAlign: 'justify',
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
            }}
          >
            {' '}
            to live by buying redeemable
          </Typography>
          <Typography
            color="secondary"
            variant="h1"
            component="span"
            sx={{ fontSize: { mobile: '2rem', laptop: '3.125rem' } }}
          >
            {' '}
            Nfts
          </Typography>
          <Typography
            variant="h1"
            component="span"
            sx={{
              color: 'white',
              textAlign: 'justify',
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
            }}
          >
            {' '}
            and staking to a
          </Typography>
          <Typography
            color="secondary"
            variant="h1"
            component="span"
            sx={{ fontSize: { mobile: '2rem', laptop: '3.125rem' } }}
          >
            {' '}
            DAO Voted Validator
          </Typography>
        </Grid>
        <Box
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            justifyContent: 'start',
            width: '100%',
            marginTop: theme.spacing(10.5),
            columnGap: theme.spacing(30 / 8),
          }}
        >
          <Button
            sx={{
              borderRadius: '90px',
            }}
            variant="contained"
            color="primary"
            size='large'
            component="a"
            href='https://app.ingl.io/mint'
            rel="noreferrer"
            target="_blank"      
          >
            Get Started
          </Button>
          <Button
            sx={{
              borderRadius: '90px',
            }}
            variant="contained"
            color="secondary"
            size='large'
            component="a"
            href='https://whitepaper.ingl.io'
            rel="noreferrer"
            target="_blank"      
          >
            Whitepaper
          </Button>
        </Box>
      </Grid>
      <Grid
        item
        mobile={0}
        laptop={5.5}
        alignContent="center"
        sx={{ display: { mobile: 'none', laptop: 'inherit' } }}
      >
        <img
          src={Hero}
          alt="ingl hero"
          style={{ width: '100%', objectFit: 'contain' }}
        />
      </Grid>
    </Grid>
  );
}
