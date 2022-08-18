import { GitHub, Twitter, Telegram } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import theme from '../theme/theme';
import Discord from '../assets/discord.png';

export default function Links() {
  const LINKS: { tooltip: string; link: string; icon: JSX.Element }[] = [
    {
      tooltip: 'github',
      link: 'https://github.com/ingl-DAO/ingl',
      icon: <GitHub color="secondary" />,
    },
    {
      tooltip: 'discord',
      link: 'https://discord.gg/9KWvjKV3Ed',
      icon: <img src={Discord} height="24px" alt="discord" />,
    },
    {
      tooltip: 'twitter',
      link: 'https://twitter.com/ingldao',
      icon: <Twitter color="secondary" />,
    },
    {
      tooltip: 'telegram',
      link: 'https://t.me/inglDAO',
      icon: <Telegram color="secondary" />,
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
          rel="noreferrer"
          sx={{ display: 'grid', alignItems: 'center' }}
          key={index}
        >
          <Tooltip arrow title={tooltip}>
            {icon}
          </Tooltip>
        </Typography>
      ))}
    </Box>
  );
}
