import { OpenInNew } from '@mui/icons-material';
import { Button, Grid, Tooltip, Typography } from '@mui/material';
import { Validator } from '.';
import theme from '../../theme/theme';

export default function ValidatorLIne({
  validator,
  isProposalOngoing,
  onVote,
  isSubmittingVote,
}: {
  validator: Validator;
  isProposalOngoing: boolean;
  isSubmittingVote: boolean;
  onVote: (validator: Validator) => void;
}) {
  const {
    asn,
    asn_concentration,
    av_distance,
    score,
    skip_rate,
    solana_cli,
    validator_pub_key,
    is_winner,
    total_vote,
  } = validator;
  return (
    <Grid
      container
      columnSpacing={2}
      sx={{
        padding: `${theme.spacing(3)} ${theme.spacing(5)}`,
        color: is_winner ? theme.palette.secondary.main : 'white',
      }}
    >
      <Grid
        item
        desktop={4}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: theme.spacing(1.5),
          alignItems: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: is_winner ? theme.palette.secondary.main : 'white',
          }}
        >
          {validator_pub_key}
        </Typography>
        <Tooltip arrow title="view on validators app">
          <a
            href={`https://www.validators.app/validators/${validator_pub_key}?locale=en&network=testnet`}
            target="_"
          >
            <OpenInNew
              fontSize="small"
              // onClick={() => navigator.clipboard.writeText(validator_pub_key)}
              sx={{
                color: is_winner ? theme.palette.secondary.main : 'white',
                '&:hover': { color: theme.palette.secondary.main },
                justifySelf: 'start',
                cursor: 'pointer',
              }}
            />
          </a>
        </Tooltip>
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            color: is_winner ? theme.palette.secondary.main : 'white',
          }}
        >{`${skip_rate}%`}</Typography>
      </Grid>
      <Grid item desktop={2} sx={{ display: 'grid', justifyItems: 'center' }}>
        {solana_cli && (
          <Typography
            variant="caption"
            sx={{
              color: is_winner ? theme.palette.secondary.main : 'white',
            }}
          >{`v${solana_cli}`}</Typography>
        )}
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        {av_distance ? (
          <Typography
            variant="caption"
            sx={{
              color: is_winner ? theme.palette.secondary.main : 'white',
            }}
          >{`${av_distance}km`}</Typography>
        ) : (
          ''
        )}
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        {score && (
          <Typography
            variant="caption"
            sx={{
              color: is_winner ? theme.palette.secondary.main : 'white',
            }}
          >{`${score}`}</Typography>
        )}
      </Grid>
      <Grid item desktop={2} sx={{ display: 'grid', justifyItems: 'center' }}>
        {asn && (
          <Typography
            variant="caption"
            sx={{
              color: is_winner ? theme.palette.secondary.main : 'white',
            }}
          >{`${asn}(${asn_concentration}%)`}</Typography>
        )}
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        {isProposalOngoing ? (
          <Button
            variant="contained"
            size="small"
            disabled={isSubmittingVote}
            onClick={() => onVote(validator)}
            sx={{
              borderRadius: '30px',
              fontSize: '0.75rem',
              padding: theme.spacing(1, 2.5),
            }}
          >
            Vote
          </Button>
        ) : (
          <Typography
            variant="caption"
            sx={{
              color: is_winner ? theme.palette.secondary.main : 'white',
            }}
          >{`${total_vote} ${is_winner ? '( WINNER👑 )' : ''}`}</Typography>
        )}
      </Grid>
    </Grid>
  );
}
