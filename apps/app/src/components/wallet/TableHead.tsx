import {
  Checkbox,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';

const WalletTableHead = ({
  onSelectAllClick,
  isHundredSelected,
  isDisabled,
}: {
  isHundredSelected: boolean;
  isDisabled: boolean;
  onSelectAllClick: () => void;
}) => {
  const theme = useTheme();
  const tableColumns = ['Ingl Gem', 'Vote Account Pub Key', 'Rewards (SOL)'];
  return (
    <TableHead>
      <TableRow>
        <TableCell
          padding="normal"
          style={{
            borderColor: theme.palette.secondary.dark,
            borderBottomWidth: '2.5px',
          }}
        >
          <Checkbox
            checked={isHundredSelected}
            onChange={onSelectAllClick}
            color="secondary"
            disabled={isDisabled}
          />
        </TableCell>
        {tableColumns.map((columns, index) => (
          <TableCell
            width={index === 1 ? '100%' : 'initial'}
            key={index}
            padding="normal"
            sx={{
              color: 'white',
              borderColor: theme.palette.secondary.dark,
              borderBottomWidth: '2.5px',
            }}
          >
            {columns}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default WalletTableHead;
