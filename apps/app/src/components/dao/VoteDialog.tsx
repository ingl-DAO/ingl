import { ReportRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Slide,
  Typography,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Scrollbars from 'rc-scrollbars';
import { forwardRef, useEffect, useState } from 'react';
import { Proposal, Validator } from '.';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import { loadInglGems } from '../../services/nft.service';
import theme from '../../theme/theme';
import DaoGem from './DaoGems';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface inglGem {
  nft_id: string;
  image_ref: string;
  generation: number;
  rarity?: string;
  gemClass:
    | 'Benitoite'
    | 'Diamond'
    | 'Emerald'
    | 'Ruby'
    | 'Sapphire'
    | 'Serendibite';
  last_voted_proposal_id: string;
}

const gemPrice: Record<
  'Benitoite' | 'Diamond' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Serendibite',
  number
> = {
  Serendibite: 5,
  Sapphire: 50,
  Ruby: 500,
  Emerald: 10,
  Diamond: 100,
  Benitoite: 1,
};

export default function VoteDialog({
  isDialogOpen,
  closeDialog,
  validator: { validator_pub_key, total_vote },
  proposal: { is_ongoing, proposal_id },
  submitVote,
}: {
  isDialogOpen: boolean;
  closeDialog: () => void;
  validator: Validator;
  proposal: Proposal;
  submitVote: (selectedGems: inglGem[]) => void;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [areGemsLoading, setAreGemsLoading] = useState<boolean>(false);
  const [userGems, setUserGems] = useState<inglGem[]>([]);
  const loadGems = () => {
    setAreGemsLoading(true);
    const notif = new useNotification();
    if (wallet?.publicKey) {
      loadInglGems(connection, wallet.publicKey)
        .then((inglGems: any) => {
          setAreGemsLoading(false);
          setUserGems(inglGems);
        })
        .catch((error) => {
          notif.update({
            type: 'ERROR',
            render: (
              <ErrorMessage
                retryFunction={loadGems}
                notification={notif}
                message={
                  error?.message ||
                  "There was a problem revealing your gem's rarity"
                }
              />
            ),
            autoClose: false,
            icon: () => <ReportRounded fontSize="large" color="error" />,
          });
        });
    }
  };
  useEffect(() => {
    // if (isDialogOpen && !is_ongoing) {
    //   //TODO: FETCH DATA HERE WITH RESPECT TO THE VOTES OF THE VALIDATOR
    //   setIsValidatorVotesLoading(true);
    //   setTimeout(() => {
    //     const newValidatorVotes = 3000;
    //     setValidatorVotes(newValidatorVotes);
    //     setIsValidatorVotesLoading(false);
    //   }, 3000);
    // }
    if (isDialogOpen && is_ongoing) {
      //TODO: FETCH DATA HERE WITH RESPECT TO THE users gems
      loadGems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen]);

  const [selectedGems, setSelectedGems] = useState<inglGem[]>([]);

  return (
    <Dialog
      open={isDialogOpen}
      TransitionComponent={Transition}
      keepMounted
      onClose={closeDialog}
      sx={{ '& .MuiPaper-root': { backgroundColor: 'black' } }}
    >
      <DialogTitle
        sx={{ color: 'white', textAlign: 'center', fontSize: '2.5rem' }}
      >
        Vote Validator
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bolder' }}
            component="span"
          >
            Validator ID:{' '}
          </Typography>
          <Typography variant="body2" component="span">
            {validator_pub_key}
          </Typography>
        </Box>
        <Box
          sx={{
            textAlign: 'center',
            display: 'grid',
            alignItems: 'center',
            gridTemplateColumns: 'auto auto',
            justifyContent: 'center',
            columnGap: theme.spacing(2),
          }}
        >
          <Typography component="span" sx={{ justifySelf: 'end' }}>
            Total Vote:{' '}
          </Typography>
          <Typography
            component="span"
            variant="h2"
            sx={{ color: theme.palette.secondary.main }}
          >
            {!is_ongoing ? (
              total_vote
            ) : areGemsLoading ? (
              <Skeleton
                variant="text"
                sx={{
                  backgroundColor: 'rgba(177,177,177,0.17)',
                  width: '200px',
                  height: '1rem',
                }}
              />
            ) : (
              selectedGems.reduce(
                (total, gem) => gemPrice[gem.gemClass] + total,
                0
              )
            )}
          </Typography>
        </Box>
        {is_ongoing && (
          <>
            <Typography
              sx={{ textAlign: 'center', marginBottom: theme.spacing(4) }}
            >
              Select the gems you want to vote with
            </Typography>
            <Scrollbars autoHide autoHeight>
              <Box
                sx={{
                  display: 'grid',
                  gridAutoFlow: 'column',
                  columnGap: theme.spacing(3),
                  width: '100%',
                }}
              >
                {areGemsLoading ? (
                  [...new Array(12)].map((_, index) => (
                    <Skeleton
                      key={index}
                      variant="rectangular"
                      height={200}
                      width={200}
                      sx={{
                        backgroundColor: 'rgba(177,177,177,0.17)',
                        borderRadius: '14px',
                      }}
                    />
                  ))
                ) : userGems.length === 0 ? (
                  <Typography variant="caption" sx={{ textAlign: 'center' }}>
                    You cannot participate in this vote as you have not gems
                  </Typography>
                ) : (
                  userGems.map((nft, index) => {
                    const { nft_id, last_voted_proposal_id, image_ref } = nft;
                    return (
                      <DaoGem
                        key={index}
                        image={image_ref}
                        isSelected={
                          selectedGems.find(
                            (selectedGem) => selectedGem.nft_id === nft_id
                          ) !== undefined
                        }
                        isUnusable={last_voted_proposal_id === proposal_id}
                        selectGem={() => {
                          if (selectedGems.find((nft) => nft.nft_id === nft_id))
                            setSelectedGems(
                              selectedGems.filter(
                                (nft) => nft.nft_id !== nft_id
                              )
                            );
                          else setSelectedGems([...selectedGems, nft]);
                        }}
                      />
                    );
                  })
                )}
              </Box>
            </Scrollbars>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {is_ongoing && userGems.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            disabled={
              selectedGems.reduce(
                (total, gem) => gemPrice[gem.gemClass] + total,
                0
              ) <= 0
            }
            onClick={() => {
              submitVote(selectedGems);
              closeDialog();
            }}
          >
            Vote
          </Button>
        )}
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            setSelectedGems([]);
            closeDialog();
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
