import { ContentCopyRounded } from '@mui/icons-material';
import { Box, Checkbox, Grid, Tooltip, Typography } from '@mui/material';
import theme from '../../theme/theme';
import { Validator } from '../dao';

export default function ValidatorCard({
  validator: {
    asn,
    asn_concentration,
    av_distance,
    score,
    skip_rate,
    solana_cli,
    validator_pub_key,
    vote_account,
  },
  selectValidator,
  isValidatorSelected,
}: {
  validator: Validator;
  selectValidator: () => void;
  isValidatorSelected: boolean;
}) {
  const displayData: { title: string; value: string; canCopy?: boolean }[] = [
    {
      title: 'Validator Pub Key',
      value: `${validator_pub_key}`,
      canCopy: true,
    },
    { title: 'Vote Account', value: `${vote_account}`, canCopy: true },
    {
      title: 'ASN ( Concentration )',
      value: `${asn === undefined ? '' : asn}  
        ${
          asn_concentration === undefined || asn_concentration === null
            ? ''
            : `( ${asn_concentration} ) %`
        } `,
    },
    {
      title: 'Solana CLI',
      value: solana_cli === undefined ? '' : `v${solana_cli}`,
    },
    { title: 'Skip Rate', value: `${skip_rate}%` },
    { title: 'Av. Distance', value: av_distance ? `${av_distance}km` : '' },
    { title: 'Score', value: score === undefined ? '' : `${score}%` },
  ];
  return (
    <Grid item mobile={12} laptop={6}>
      <Box
        sx={{
          backgroundColor: theme.palette.primary.dark,
          position: 'relative',
          padding: theme.spacing(2),
          borderRadius: '9px',
        }}
        onClick={selectValidator}
      >
        <Checkbox
          color="secondary"
          checked={isValidatorSelected}
          sx={{ position: 'absolute', bottom: 0, right: 0 }}
        />
        {displayData.map(({ title, value, canCopy }, index) => (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gridAutoFlow: 'column',
              columnGap: theme.spacing(1),
              width: 'fit-content',
              cursor: 'pointer',
              alignItems: 'center',
            }}
          >
            <Typography
              component="span"
              variant="caption"
            >{`${title}: `}</Typography>
            <Typography component="span" variant="body1">
              {value}
            </Typography>
            {canCopy && (
              <Tooltip arrow title="copy">
                <ContentCopyRounded
                  fontSize="small"
                  onClick={() => navigator.clipboard.writeText(value)}
                  sx={{
                    color: 'white',
                    '&:hover': { color: theme.palette.secondary.main },
                    justifySelf: 'start',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>
    </Grid>
  );
}
