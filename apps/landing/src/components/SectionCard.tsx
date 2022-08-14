import { Button, Grid, Typography } from '@mui/material';
import DSOLER_CARD from '../assets/dsoler_card.png';
import Validator from '../assets/validator.png';
import theme from '../theme/theme';
import SectionTitle from './SectionTitle';

export default function SectionCard() {
  const sections: {
    title: string;
    paragraphs: { text: { value: string; ref?: string }[] }[];
    image: string;
    buttonText: string;
    buttonLink: string;
  }[] = [
    {
      title: 'ingl Gems',
      paragraphs: [
        {
          text: [
            {
              value:
                'Sol backed and redeemable nfts. They are backed by an equivalent amount of sol used to mint.',
            },
          ],
        },
        {
          text: [
            {
              value: 'There are different classes, each representing the ',
            },
            {
              value: 'amount of Sol',
              ref: 'https://whitepaper.ingl.io',
            },
            {
              value:
                ' backing it. Each gem has one of six rarities and mints under a specific generation.',
            },
          ],
        },
        {
          text: [
            {
              value:
                'Ingl gems are our governance unit and are necessary to create and vote proposals and also to vote for the next onboarding validator.',
            },
          ],
        },
      ],
      image: DSOLER_CARD,
      buttonText: 'Start Minting Now',
      buttonLink: 'https://app.ingl.io/',
    },
    {
      title: 'VALIDATORS',
      paragraphs: [
        {
          text: [
            {
              value:
                "ingl DAO's mission is to profitably onboard as much validators as possible to the Solana blockchain. This is done by providing the equivalent daily voting fees to validator owners and sharing their voting rewards to the gem owners.",
            },
          ],
        },
        {
          text: [
            {
              value: 'With minimum ',
            },
            {
              value: 'solona validator requirements',
              ref: 'https://whitepaper.ingl.io',
            },
            {
              value:
                ' met, device owners can onboard their computing unit to the solana network without worries of the necessary voting.',
            },
          ],
        },
        {
          text: [
            {
              value:
                'Onboarded computing units keep part of voting rewards and share the rest with  other participants.',
            },
          ],
        },
      ],
      image: Validator,
      buttonText: 'Onboard PC Now',
      buttonLink: 'https://app.ingl.io/onboard',
    },
  ];
  return (
    <>
      {sections.map(
        ({ title, paragraphs, image, buttonText, buttonLink }, index) => (
          <Grid
            container
            direction={index % 2 === 1 ? 'row-reverse' : 'row'}
            alignItems="center"
            columnSpacing={17.625}
          >
            <Grid
              item
              mobile={0}
              laptop={3.8}
              sx={{ display: { mobile: 'none', laptop: 'inherit' } }}
            >
              <img
                src={image}
                alt={`${title} description`}
                style={{ width: '100%' }}
              />
            </Grid>
            <Grid item mobile={12} laptop={8.2}>
              <SectionTitle title={title} />
              {paragraphs.map(({ text }, index) => (
                <Typography
                  key={index}
                  sx={{
                    marginBottom:
                      index + 1 === paragraphs.length ? 0 : theme.spacing(2.5),
                  }}
                >
                  {text.map(({ value, ref }, pIndex) =>
                    ref !== undefined ? (
                      <Typography
                        component="a"
                        href={ref}
                        rel="noreferrer"
                        sx={{
                          color: theme.palette.secondary.main,
                        }}
                      >
                        {value}
                      </Typography>
                    ) : (
                      <Typography component="span" key={pIndex}>
                        {value}
                      </Typography>
                    )
                  )}
                </Typography>
              ))}
              <Button
                color="primary"
                variant="contained"
                size="large"
                component="a"
                href={buttonLink}
                rel="noreferrer"
                sx={{ borderRadius: '90px', marginTop: theme.spacing(7.125) }}
              >
                {buttonText}
              </Button>
            </Grid>
          </Grid>
        )
      )}
    </>
  );
}
