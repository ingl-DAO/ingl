import { Checkbox, TableCell, TableHead, TableRow } from '@mui/material';

const WalletTableHead = ({
  onSelectAllClick,
  isHundredSelected,
  isDisabled,
}: {
  isHundredSelected: boolean;
  isDisabled: boolean;
  onSelectAllClick: () => void;
}) => {
  const tableColumns = ['Ingl Gem', 'Validator Pub Key', 'Rewards (SOL)'];
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="normal">
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
            sx={{ color: 'white' }}
          >
            {columns}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default WalletTableHead;
