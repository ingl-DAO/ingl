import { Menu, MenuItem } from '@mui/material';
import { Proposal } from '.';
import ProposalNumber from './ProposalNumber';

export default function ProposalSelectionMenu({
  anchorEl,
  isMenuOpen,
  onClose,
  proposals,
  selectProposal,
}: {
  selectProposal: (proposal: Proposal) => void;
  anchorEl: null | HTMLElement;
  isMenuOpen: boolean;
  onClose: () => void;
  proposals: Proposal[];
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={isMenuOpen}
      elevation={0}
      onClose={onClose}
      sx={{
        '& .MuiPaper-root': {
          backgroundColor: '#10141E',
        },
      }}
    >
      {proposals.map((proposal, index) => (
        <MenuItem
          dense
          onClick={() => {
            selectProposal(proposal);
            onClose();
          }}
          key={index}
        >
          <ProposalNumber proposal={proposal} key={index} />
        </MenuItem>
      ))}
    </Menu>
  );
}
