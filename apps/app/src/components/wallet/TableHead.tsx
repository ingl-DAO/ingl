import { Checkbox, TableCell, TableHead, TableRow } from '@mui/material';

const WalletTableHead = ({
  onSelectAllClick,
  isSubmittingExamSuccess,
  isDataLoading,
  isHundredSelected
}: {
  isHundredSelected:boolean;
  isSubmittingExamSuccess: boolean;
  isDataLoading: boolean;
  onSelectAllClick: () => void;
}) => {
  const tableColumns = ['Ingl Gem', 'Validator Pub Key', 'Rewards (SOL)'];
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="normal">
          <Checkbox
            // indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={isHundredSelected}
            onChange={onSelectAllClick}
            color="secondary"
            disabled={isSubmittingExamSuccess || isDataLoading}
          />
        </TableCell>
        {tableColumns.map((columns, index) => (
          <TableCell key={index} padding="normal" sx={{ color: 'white' }}>
            {columns}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default WalletTableHead;
