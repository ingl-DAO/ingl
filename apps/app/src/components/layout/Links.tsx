import { GitHub, LinkedIn, Twitter } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import theme from '../../theme/theme';

export default function Links() {
  const LINKS: { tooltip: string; link: string; icon: JSX.Element }[] = [
    {
      tooltip: 'github',
      link: 'https://gitlab.com/inglproject/ingl',
      icon: <GitHub color="secondary" />,
    },
    {
      tooltip: 'twitter',
      link: 'https://twitter.com/ingl',
      icon: <Twitter color="secondary" />,
    },
    {
      tooltip: 'linkedIn',
      link: 'https://linkedin.com',
      icon: <LinkedIn color="secondary" />,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        justifyContent: 'start',
        columnGap: theme.spacing(1),
      }}
    >
      {LINKS.map(({ tooltip, link, icon }, index) => (
        <Typography
          component="a"
          href={link}
          key={index}
          rel="noreferrer"
          target="_blank"
          sx={{ display: 'grid', alignItems: 'center' }}
        >
          <Tooltip arrow title={tooltip}>
            {icon}
          </Tooltip>
        </Typography>
      ))}
    </Box>
  );
}
