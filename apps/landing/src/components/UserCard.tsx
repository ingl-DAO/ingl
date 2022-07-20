import { GitHub, Twitter } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import theme from '../theme/theme';
import { Member } from './Team';

export default function UserCard({
  member: { imageRef, twitterRef, gitRef, role, fullname },
}: {
  member: Member;
}) {
  return (
    <Box sx={{ borderRadius: '10px', position: 'relative' }}>
      <Box sx={{ height: { laptop: '300px', mobile: '192px' } }}>
        <img
          src={imageRef}
          alt={`${fullname}'s profile`}
          style={{
            width: '100%',
            height: 'inherit',
            objectFit: 'cover',
            borderRadius: '30px',
          }}
        />
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 4,
          right: 0,
          left: '-2px',
          width: '95%',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
          background:
            'linear-gradient(0deg, rgba(0, 53, 102, 0.5), rgba(0, 53, 102, 0.5)), rgba(0, 0, 0, 0.5)',
          borderRadius: '90px',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: 'white',
            textAlign: 'start',
            fontSize: {
              laptop: '1.5rem',
              mobile: '0.96rem',
              padding: '0 20px',
            },
          }}
        >
          {fullname}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            padding: '0 20px',
          }}
        >
          <Typography
            color={theme.palette.secondary.main}
            sx={{
              fontSize: {
                laptop: '1.125rem',
                mobile: '0.72rem',
                textAlign: 'start',
              },
            }}
          >
            {role}
          </Typography>
          <Box>
            <Typography
              component="a"
              href={twitterRef}
              rel="noreferrer"
              target="_blank"
            >
              <Tooltip arrow title={`${fullname}'s twitter`}>
                <Twitter color="secondary" fontSize="small" />
              </Tooltip>
            </Typography>
            <Typography
              component="a"
              href={gitRef}
              rel="noreferrer"
              target="_blank"
            >
              <Tooltip arrow title={`${fullname}'s git`}>
                <GitHub color="secondary" fontSize="small" />
              </Tooltip>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
