import { PriorityHighRounded } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Slide,
  TextField,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef, useState } from 'react';
import useNotification from '../../common/utils/notification';
import { NftClass } from '../../services/state';
import theme from '../../theme/theme';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function MintGemDialog({
  isDialogOpen,
  closeDialog,
  onValidate,
}: {
  isDialogOpen: boolean;
  closeDialog: () => void;
  onValidate: (mintClass: NftClass) => void;
}) {
  const [selectedMintClass, setSelectedMintClass] = useState<NftClass>(
    NftClass.Benitoite
  );
  const NftClasses: { price: number; value: NftClass; label: string }[] = [
    { price: 1, label: 'Benitoite', value: NftClass.Benitoite },
    { price: 100, label: 'Diamond', value: NftClass.Diamond },
    { price: 10, label: 'Emerald', value: NftClass.Emerald },
    { price: 500, label: 'Ruby', value: NftClass.Ruby },
    { price: 50, label: 'Sapphire', value: NftClass.Sapphire },
    { price: 5, label: 'Serendibite', value: NftClass.Serendibite },
  ];
  return (
    <Dialog
      open={isDialogOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={closeDialog}
      sx={{ '& .MuiPaper-root': { backgroundColor: 'black' } }}
    >
      <DialogTitle sx={{ color: 'white' }}>Mint ingl Gem</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <DialogContentText
          sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Please select the class of ingl gems you want
        </DialogContentText>
        <TextField
          select
          label="Gem class"
          value={selectedMintClass}
          color="secondary"
          fullWidth
          sx={{
            marginTop: theme.spacing(2),
            '& .MuiSelect-select, .MuiSvgIcon-root': {
              color: 'white',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const nftClass = NftClasses.find(
              (_) => _.value === Number(event.target.value)
            );
            if (nftClass) setSelectedMintClass(nftClass.value);
          }}
        >
          {NftClasses.map((nftClass, index) => (
            <MenuItem
              sx={{ color: 'black' }}
              key={index}
              value={nftClass.value}
            >
              {`${nftClass.label} - ${nftClass.price} SOL`}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={closeDialog}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            if (selectedMintClass) {
              onValidate(selectedMintClass);
              closeDialog();
            } else {
              const notif = new useNotification();
              notif.notify({ render: 'Minting your awesome nft' });
              notif.update({
                type: 'INFO',
                render: 'Select a class to mint',
                autoClose: 5000,
                icon: () => <PriorityHighRounded color="error" />,
              });
            }
          }}
        >
          Mint
        </Button>
      </DialogActions>
    </Dialog>
  );
}
