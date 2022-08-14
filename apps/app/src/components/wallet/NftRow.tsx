import { Avatar, Checkbox, TableCell, TableRow } from '@mui/material';
import theme from '../../theme/theme';

export default function NftRow({
  isChecked,
  selectNft,
  isClaimingDialog,
  isNftsLoading,
  rowData: { image_ref, validator_pub_key, rewards },
}: {
  isChecked: boolean;
  selectNft: () => void;
  isClaimingDialog: boolean;
  isNftsLoading: boolean;
  rowData: { image_ref: string; validator_pub_key: string; rewards: number };
}) {
  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell
        component="th"
        scope="row"
        style={{
          borderColor: theme.palette.secondary.dark,
          borderBottomWidth: '2.5px',
        }}
      >
        <Checkbox
          checked={isChecked}
          onChange={selectNft}
          color="secondary"
          disabled={isClaimingDialog || isNftsLoading}
        />
      </TableCell>
      <TableCell
        component="th"
        scope="row"
        style={{
          borderColor: theme.palette.secondary.dark,
          borderBottomWidth: '2.5px',
        }}
      >
        <Avatar
          src={image_ref}
          alt="ingl gem"
          sx={{ height: '75px', width: '75px' }}
        />
      </TableCell>
      <TableCell
        width="100%"
        align="left"
        sx={{
          color: theme.common.line,
          borderColor: theme.palette.secondary.dark,
          borderBottomWidth: '2.5px',
        }}
      >
        {validator_pub_key}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          color: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.dark,
          borderBottomWidth: '2.5px',
        }}
      >{`${rewards}`}</TableCell>
    </TableRow>
  );
}
