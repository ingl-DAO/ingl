import { Typography } from '@mui/material';
import { injectIntl, IntlShape } from 'react-intl';

export function Test({ intl: { formatMessage } }: { intl: IntlShape }) {
  return (
    <Typography variant="h1" color="success">
      {[...new Array(120)].map((_) => formatMessage({ id: 'welcomeText' }))}
      {/* {formatMessage({ id: 'welcomeText' })} */}
    </Typography>
  );
}
export default injectIntl(Test);
