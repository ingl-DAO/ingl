import { LinkedIn } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import theme from '../theme/theme';
import { Member } from './Team';

export default function UserCard({
  member: { imageRef, linkedinRef, role, fullname },
}: {
  member: Member;
}) {
  return (
    <Box
      sx={{
        borderRadius: '30px',
        position: 'relative',
        backgroundColor: `rgba(0,0,0,0.2)`,
      }}
    >
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
              href={linkedinRef}
              rel="noreferrer"
              target="_blank"
            >
              <Tooltip arrow title={`${fullname}'s linkedin`}>
                <LinkedIn color="secondary" />
              </Tooltip>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
