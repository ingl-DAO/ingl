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
  } = validator;
  return (
    <Grid
      container
      columnSpacing={2}
      sx={{
        padding: `${theme.spacing(3)} ${theme.spacing(5)}`,
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
        <Typography variant="caption">{validator_pub_key}</Typography>
        <Tooltip arrow title="view in explorer">
          <a
            href={`https://explorer.solana.com/address/${validator_pub_key}?cluster=devnet`}
            target="_"
          >
            <OpenInNew
              fontSize="small"
              // onClick={() => navigator.clipboard.writeText(validator_pub_key)}
              sx={{
                color: 'white',
                '&:hover': { color: theme.palette.secondary.main },
                justifySelf: 'start',
                cursor: 'pointer',
              }}
            />
          </a>
        </Tooltip>
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Typography variant="caption">{`${skip_rate}%`}</Typography>
      </Grid>
      <Grid item desktop={2} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Typography variant="caption">{`v${solana_cli}`}</Typography>
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Typography variant="caption">{`${av_distance}km`}</Typography>
      </Grid>
      <Grid item desktop={2} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Typography variant="caption">{`${asn}(${asn_concentration})`}</Typography>
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Typography variant="caption">{`${score}%`}</Typography>
      </Grid>
      <Grid item desktop={1} sx={{ display: 'grid', justifyItems: 'center' }}>
        <Button
          variant="contained"
          size="small"
          disabled={isSubmittingVote}
          onClick={() => onVote(validator)}
        >
          {isProposalOngoing ? 'Vote' : 'View'}
        </Button>
      </Grid>
    </Grid>
  );
}
