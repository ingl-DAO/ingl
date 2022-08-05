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
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ActionDialog({
  isDialogOpen,
  closeDialog,
  dialogContent: { title, content, agreeText, agreeFunction },
}: {
  isDialogOpen: boolean;
  closeDialog: () => void;
  dialogContent: {
    title: string;
    content: string;
    agreeText: string;
    agreeFunction: () => void;
  };
}) {
  return (
    <Dialog
      open={isDialogOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={closeDialog}
      sx={{ '& .MuiPaper-root': { backgroundColor: 'black' } }}
    >
      <DialogTitle sx={{ color: 'white' }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}
        >
          {content}
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
            agreeFunction();
            closeDialog();
          }}
        >
          {agreeText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
