import { Button, Grid, Typography } from '@mui/material';
import DSOLER_CARD from '../assets/dsoler_card.png';
import Validator from '../assets/validator.png';
import theme from '../theme/theme';
import SectionTitle from './SectionTitle';

export default function SectionCard() {
  const sections: {
    title: string;
    description: string;
    image: string;
    buttonText: string;
    buttonLink: string;
  }[] = [
    {
      title: 'nft Collections',
      description:
        "Lorem ipsum s simply dummy text of the printing and typesetting industry.Lo Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      image: DSOLER_CARD,
      buttonText: 'Start Minting Now',
      buttonLink: 'https://app.ingl.io/mint',
    },
    {
      title: 'VALIDATORS',
      description:
        "Lorem ipsum s simply dummy text of the printing and typesetting industry.Lo Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      image: Validator,
      buttonText: 'Onboard PC Now',
      buttonLink: 'https://app.ingl.io/onboard',
    },
  ];
  return (
    <>
      {sections.map(
        ({ title, description, image, buttonText, buttonLink }, index) => (
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
              <Typography>{description}</Typography>
              <Button
                color="primary"
                variant="contained"
                size="large"
                component="a"
                href={buttonLink}
                rel="noreferrer"
                target="_blank"
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
