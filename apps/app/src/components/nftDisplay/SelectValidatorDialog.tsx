import { PriorityHighRounded } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef, useEffect, useState } from 'react';
import useNotification from '../../common/utils/notification';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SelectValidatorDialog({
  isDialogOpen,
  closeDialog,
  onValidate,
}: {
  isDialogOpen: boolean;
  closeDialog: () => void;
  onValidate: (validator_id: string) => void;
}) {
  useEffect(() => {
    // TODO: CALL API HERE TO LOAD VALIDATORS
    console.log();
  }, []);

  const [selectedValidatorId, setSelectedValidatorId] = useState<string>('helo');

  return (
    <Dialog
      open={isDialogOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={closeDialog}
      sx={{ '& .MuiPaper-root': { backgroundColor: 'black' } }}
      fullScreen
    >
      <DialogTitle sx={{ color: 'white' }}>Delegate to Validator</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <DialogContentText
          sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Select the validator you want to delegate to
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={closeDialog}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            if (selectedValidatorId) {
              onValidate(selectedValidatorId);
              closeDialog();
            } else {
              const notif = new useNotification();
              notif.notify({ render: 'Delegating your nft' });
              notif.update({
                type: 'INFO',
                render: 'Select a validator to proceed',
                autoClose: 5000,
                icon: () => <PriorityHighRounded color="error" />,
              });
            }
          }}
        >
          Delegate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
