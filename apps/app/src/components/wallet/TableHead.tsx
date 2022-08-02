import { Checkbox, TableCell, TableHead, TableRow } from '@mui/material';

const WalletTableHead = (
    {
  onSelectAllClick,
  numSelected,
  rowCount,
  isSubmittingExamSuccess,
  showResult,
  isDataLoading,
}: {numSelected: number, rowCount:number, isSubmittingExamSuccess:boolean, showResult:()=>boolean, isDataLoading:boolean, onSelectAllClick: ()=>void}
) => {
  const headCells = [
    { id: 1, label: 'FullnameLearnersTableHead' },
    { id: 2, label: 'PhoneLearnersTableHead' },
    { id: 3, label: 'PhoneLearnersTableHead' },
    { id: 4, label: 'RemainsLearnersTableHead' },
    { id: 5, label: 'DocumentLearnersTableHead' },
    { id: 6, label: 'SuccessLearnersTableHead' },
  ];
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="normal">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            color="primary"
            disabled={isSubmittingExamSuccess || isDataLoading || !showResult()}
          />
        </TableCell>
        {headCells.map((headCell) => {
          return headCell.id !== 6 || showResult() ? (
            <TableCell
              key={headCell.id}
            //   align={headCell.id === 5 || headCell.id === 6 ? 'center' : 'left'}
              padding="normal"
            >
              {headCell.label}
            </TableCell>
          ) : null;
        })}
        <TableCell
          sx={{
            '&.MuiTableCell-root': {
              width: '8vw',
            },
          }}
          padding="normal"
        />
      </TableRow>
    </TableHead>
  );
};

export default WalletTableHead;
