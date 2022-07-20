import { Box, Typography } from '@mui/material';
import theme from '../theme/theme';

export default function SectionTitle({
  title,
  center,
}: {
  title: string;
  center?: boolean;
}) {
  return (
    <Box
      sx={{
        marginBottom: theme.spacing(5.875),
        marginTop: theme.spacing(5.875),
        textAlign: center ? 'center' : 'initial',
      }}
    >
      {title.split(' ').map((part, index) => (
        <Typography
          variant="h1"
          component="span"
          key={index}
          sx={{
            color: index % 2 === 1 ? 'white' : theme.palette.secondary.main,
            textAlign: 'justify',
            fontSize: { mobile: '2rem', laptop: '3.125rem' },
          }}
        >
          {' ' + part.toUpperCase()}
        </Typography>
      ))}
    </Box>
  );
}
