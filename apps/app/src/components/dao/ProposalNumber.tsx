import { Box, Typography } from '@mui/material';
import { injectIntl, IntlShape } from 'react-intl';
import { Proposal } from '.';
import theme from '../../theme/theme';

function ProposalNumber({
  intl: { formatDate },
  proposal,
}: {
  intl: IntlShape;
  proposal: Proposal;
}) {
  const { start_date, end_date, proposal_numeration, is_ongoing } = proposal;

  return (
    <Box
      sx={{
        display: 'grid',
        gridAutoFlow: 'column',
        width: 'fit-content',
        columnGap: theme.spacing(0.5),
        alignItems: 'center',
      }}
    >
      <Typography variant="body1">{proposal_numeration}</Typography>
      {is_ongoing ? (
        <Typography
          sx={{ color: theme.palette.secondary.main }}
          variant="overline"
        >
          ( current )
        </Typography>
      ) : end_date ? (
        <Typography variant="overline" sx={{ color: 'white' }}>
          (
          {formatDate(new Date(start_date), {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          })}{' '}
          -
          {formatDate(new Date(end_date), {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          })}{' '}
          )
        </Typography>
      ) : (
        <Typography variant="overline" sx={{ color: 'white' }}>
          ( indeterminate )
        </Typography>
      )}
    </Box>
  );
}
export default injectIntl(ProposalNumber);
