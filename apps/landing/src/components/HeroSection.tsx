import { Box, Button, Grid, Typography } from '@mui/material';
import Hero from '../assets/hero.png';
import theme from '../theme/theme';

export default function HeroSection() {
  return (
    <Grid container spacing={4.5} sx={{ marginTop: 12.3 }}>
      <Grid item container mobile={12} laptop={6.5} alignContent="center">
        <Grid item mobile={12} sx={{ textAlign: 'left', wordSpacing: '25px' }}>
          <Typography
            variant="h1"
            component="span"
            sx={{
              background:
                'linear-gradient(90.71deg, #003566 46.26%, #02C39A 80.31%);',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
            }}
          >
            Earn SOL
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
            by minting equivalently backed and{' '}
          </Typography>
          <Typography
            color="secondary"
            variant="h1"
            component="span"
            sx={{ fontSize: { mobile: '2rem', laptop: '3.125rem' } }}
          >
            redeemable ingl gems
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
            and delegating to
          </Typography>
          <Typography
            color="secondary"
            variant="h1"
            component="span"
            sx={{
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
              background:
                'linear-gradient(90.71deg,  #02C39A 46.26%, #003566 80.31%);',
              backgroundClip: 'text',
              textFillColor: 'transparent',
            }}
          >
            {' '}
            DAO voted validators
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
              padding: theme.spacing(1.25, 6),
            }}
            variant="contained"
            color="primary"
            size="large"
            component="a"
            href="https://app.ingl.io/"
            rel="noreferrer"
          >
            Visit App
          </Button>
          <Button
            sx={{
              borderRadius: '90px',
              padding: theme.spacing(1.25, 6),
            }}
            variant="contained"
            color="secondary"
            size="large"
            component="a"
            href="https://whitepaper.ingl.io"
            rel="noreferrer"
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
