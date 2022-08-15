import { PriorityHighRounded, ReportRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Skeleton,
  Slide,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { forwardRef, useEffect, useState } from 'react';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import { getVoteAccounts } from '../../services/nft.service';
import { Validator } from '../dao';
import ValidatorCard from './ValidatorCard';

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
  onValidate: (vote_account: string) => void;
}) {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [isValidatorsLoading, setIsValidatorsLoading] =
    useState<boolean>(false);

  const wallet = useWallet();
  const { connection } = useConnection();

  const notif = new useNotification();

  const loadValidators = () => {
    setIsValidatorsLoading(true);
    // TODO: CALL API HERE TO LOAD VALIDATORS
    let newValidators: Validator[] = [
      {
        validator_pub_key: 'qXh3G5eogP6NHx5FLRzDTrLJwiaNCYULwguZTGaa9Fw',
        asn: 'AS12424',
        asn_concentration: 0.34,
        av_distance: 15,
        score: 60,
        skip_rate: 23,
        solana_cli: '2.3.33',
        vote_account: 'hello wold',
      },
      {
        validator_pub_key: 'qXh3G5eogP6NHxFLRzDTrLJwiaNCYULwguZTGaa9Fw',
        asn: 'AS12424',
        asn_concentration: 0.34,
        av_distance: 15,
        score: 60,
        skip_rate: 23,
        solana_cli: '2.3.33',
        vote_account: 'hello world',
      },
    ];
    //adding votes accounts ids to corresponding validators
    getVoteAccounts(connection)
      .then((voteAccounts) => {
        newValidators = newValidators.map((validator) => {
          const vote = voteAccounts.find(
            (voteAccount) =>
              voteAccount.validator_id.toString() ===
              validator.validator_pub_key
          );
          return vote
            ? {
                ...validator,
                vote_account: vote.vote_account.toString(),
                validator_pub_key: vote.validator_id.toString() as string,
              }
            : validator;
        });
        setValidators(newValidators);
        setIsValidatorsLoading(false);
      })
      .catch((error) => {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={() => loadValidators()}
              notification={notif}
              closeFunction={() => {
                notif.dismiss();
              }}
              message={error?.message}
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
      });
  };

  useEffect(() => {
    if (isDialogOpen) {
      loadValidators();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]);

  const [selectedValidatorVoteKey, setSelectedValidatorVoteKey] =
    useState<string>();

  const exitDialog = () => {
    setValidators([]);
    setSelectedValidatorVoteKey(undefined);
    closeDialog();
  };

  return (
    <Dialog
      open={isDialogOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={exitDialog}
      sx={{ '& .MuiPaper-root': { backgroundColor: 'black' } }}
      fullScreen
    >
      <DialogTitle
        sx={{ color: 'white', fontSize: '2.5rem', textAlign: 'center' }}
      >
        Delegate to Validator
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Box sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          <Typography variant="overline">
            Select the validator you want to delegate to
          </Typography>
          <Grid container spacing={2}>
            {isValidatorsLoading ? (
              [...new Array(12)].map((_, index) => (
                <Grid item mobile={12} laptop={6}>
                  <Skeleton
                    variant="rectangular"
                    height={200}
                    width={'100%'}
                    sx={{
                      backgroundColor: 'rgba(177,177,177,0.17)',
                      borderRadius: '9px',
                    }}
                  />
                </Grid>
              ))
            ) : validators.length === 0 ? (
              <Typography variant="caption">
                There are no validators to delegate to at this moment
              </Typography>
            ) : (
              validators.map((validator, index) =>
                validator.vote_account ? (
                  <ValidatorCard
                    key={index}
                    validator={validator}
                    selectValidator={() => {
                      if (validator.vote_account) {
                        if (selectedValidatorVoteKey === validator.vote_account)
                          setSelectedValidatorVoteKey(undefined);
                        else
                          setSelectedValidatorVoteKey(validator.vote_account);
                      }
                    }}
                    isValidatorSelected={
                      validator.vote_account === selectedValidatorVoteKey
                    }
                  />
                ) : null
              )
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="primary" onClick={exitDialog}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={selectedValidatorVoteKey === undefined}
          color="secondary"
          onClick={() => {
            if (selectedValidatorVoteKey) {
              onValidate(selectedValidatorVoteKey);
              exitDialog();
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
