import { KeyboardArrowDownRounded, ReportRounded } from '@mui/icons-material';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import Scrollbars from 'rc-scrollbars';
import { useEffect, useState } from 'react';
import { injectIntl, IntlShape } from 'react-intl';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import random from '../../common/utils/random';
import theme from '../../theme/theme';
import InglNumber from './inglNumber';
import ProposalNumber from './ProposalNumber';
import ProposalSelectionMenu from './ProposalSelectionMenu';
import ValidatorLIne from './ValidatorLIne';
import VoteDialog, { inglGem } from './VoteDialog';

export interface InglSummary {
  title: 'counter' | 'total_raised' | 'pd_pool_total' | 'delegated_total';
  amount: number;
  displayTitle: string;
}

export interface Proposal {
  proposal_id: string;
  start_date: Date;
  end_date?: Date;
  is_ongoing: boolean;
  proposal_numeration: number;
}

export interface Validator {
  validator_pub_key: string;
  skip_rate: number;
  solana_cli: string;
  av_distance: number;
  asn: string;
  asn_concentration: number;
  score: number;
  vote_account?:string;
}

function Dao({ intl: { formatDate } }: { intl: IntlShape }) {
  const [inglNumbers, setInglNumbers] = useState<InglSummary[]>([
    { title: 'counter', amount: 0, displayTitle: 'Total Nfts Minted' },
    { title: 'total_raised', amount: 0, displayTitle: 'Total Raised (SOL)' },
    {
      title: 'pd_pool_total',
      amount: 0,
      displayTitle: 'Pending Delegation (SOL)',
    },
    {
      title: 'delegated_total',
      amount: 0,
      displayTitle: 'Total Delegated (SOL)',
    },
  ]);
  const [isInglNumbersLoading, setIsInglNumbersLoading] =
    useState<boolean>(false);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal>();
  const [isProposalsLoading, setIsProposalsLoading] = useState<boolean>(false);

  useEffect(() => {
    //TODO: FETCH DATA WITH RESPECT to the different proposals
    setIsProposalsLoading(true);
    setTimeout(() => {
      const newProposals: Proposal[] = [
        {
          proposal_id: 'h',
          start_date: new Date('12/12/12'),
          end_date: new Date(),
          is_ongoing: true,
          proposal_numeration: 1,
        },
      ];
      setProposals(newProposals);
      const newSelectedProposal = proposals.find(
        (proposal) => proposal.is_ongoing
      );
      if (newSelectedProposal) {
        setSelectedProposal(newSelectedProposal);
      } else if (newProposals.length > 0) {
        setSelectedProposal(
          newProposals.sort((propA, propB) =>
            new Date(propA.start_date) > new Date(propB.start_date) ? -1 : 1
          )[0]
        );
      }
      setIsProposalsLoading(false);
    }, 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [validators, setValidators] = useState<Validator[]>([]);
  const [isLoadingProposalData, setIsLoadingProposalData] =
    useState<boolean>(true);
  useEffect(() => {
    //TODO: FETCH DATA OF THE selected proposal here
    if (selectedProposal) {
      setIsLoadingProposalData(true);
      setTimeout(() => {
        setValidators([
          {
            validator_pub_key: 'qXh3G5eogP6NHx5FLRzDTrLJwiaNCYULwguZTGaa9Fw',
            asn: 'AS12424',
            asn_concentration: 0.34,
            av_distance: 15,
            score: 60,
            skip_rate: 23,
            solana_cli: '2.3.33',
          },
        ]);
        setIsLoadingProposalData(false);
      }, 3000);
    }
  }, [selectedProposal]);

  useEffect(() => {
    //TODO: FETCH DATA HERE WITH RESPECT inglNumbers
    setIsInglNumbersLoading(true);
    setTimeout(() => {
      setInglNumbers([
        { title: 'counter', amount: 90, displayTitle: 'Total Nfts Minted' },
        {
          title: 'total_raised',
          amount: 60070000,
          displayTitle: 'Total Raised (SOL)',
        },
        {
          title: 'pd_pool_total',
          amount: 60070000,
          displayTitle: 'Pending Delegation (SOL)',
        },
        {
          title: 'delegated_total',
          amount: 60070000,
          displayTitle: 'Total Delegated (SOL)',
        },
      ]);
      setIsInglNumbersLoading(false);
    }, 3000);
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const tableHeaders: { title: string; gridSpace: number }[] = [
    { title: 'Validator Pub Key', gridSpace: 4 },
    { title: 'Skip Rate', gridSpace: 1 },
    { title: 'Solana CLI', gridSpace: 2 },
    { title: 'Av. Distance', gridSpace: 1 },
    { title: 'ASN( Concentration )', gridSpace: 2 },
    { title: 'Score', gridSpace: 1 },
    { title: 'Actions', gridSpace: 1 },
  ];

  const [selectedValidator, setSelectedValidator] = useState<Validator>();
  const [isValidatorVoteDialogOpen, setIsValidatorVoteDialogOpen] =
    useState<boolean>(false);

  const [notifs, setNotifs] = useState<useNotification[]>();
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
  const voteValidator = (selectedGems: inglGem[]) => {
    //TODO: CALL API HERE TO VOTE ON A PROPOSAL: THE DETAILS INCLUDE: selectedProposal, selectedValidator, selectedGems
    if (notifs) notifs.forEach((publishedNotif) => publishedNotif.dismiss());
    const notif = new useNotification();
    if (notifs) setNotifs([...notifs, notif]);
    else setNotifs([notif]);
    notif.notify({ render: `Submitting your vote` });
    setIsSubmittingVote(true);
    setTimeout(() => {
      if (random() > 5) {
        // TODO CALL API HERE TO  MINT NFT with class mintClass
        notif.update({
          render: 'Vote submitted successfully',
        });
      } else {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={() => voteValidator(selectedGems)}
              notification={notif}
              //TODO: this message is that coming from the backend
              message="There was a problem submitting your vote"
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
      }
      setIsSubmittingVote(false);
    }, 3000);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: selectedProposal
          ? 'auto auto auto 1fr'
          : 'auto auto 1fr',
      }}
    >
      <Box
        sx={{
          padding: theme.spacing(4),
          borderBottom: `5px solid ${theme.palette.primary.main}`,
          display: 'grid',
          gridTemplateColumns: {
            laptop: 'repeat(auto-fit, minmax(290px, 1fr))',
            mobile: 'repeat(auto-fit, minmax(auto, 1fr))',
          },
          columnGap: theme.spacing(2),
          rowGap: theme.spacing(2),
        }}
      >
        {inglNumbers.map((data, index) => (
          <InglNumber
            key={index}
            data={data}
            isDataLoading={isInglNumbersLoading}
          />
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          padding: `${theme.spacing(2)} ${theme.spacing(5)}`,
          gridAutoFlow: 'column',
          alignItems: 'center',
          gridGap: theme.spacing(1),
          borderBottom: `5px solid ${theme.palette.primary.main}`,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            width: 'fit-content',
            gridAutoFlow: 'column',
            alignItems: 'center',
            gridGap: theme.spacing(1),
          }}
        >
          <Typography sx={{ fontWeight: 'bold' }}>Proposal No</Typography>
          <ProposalSelectionMenu
            anchorEl={anchorEl}
            isMenuOpen={isMenuOpen}
            proposals={proposals}
            selectProposal={(proposal: Proposal) =>
              setSelectedProposal(proposal)
            }
            onClose={() => {
              setIsMenuOpen(false);
              setAnchorEl(null);
            }}
          />

          <Box
            sx={{
              display: 'grid',
              gridAutoFlow: 'column',
              width: 'fit-content',
              columnGap: theme.spacing(0.5),
              alignItems: 'center',
              cursor:
                !isProposalsLoading && proposals.length > 0
                  ? 'pointer'
                  : 'initial',
            }}
            onClick={(event) => {
              if (!isProposalsLoading && proposals.length > 0 && !isSubmittingVote) {
                setAnchorEl(event.currentTarget);
                setIsMenuOpen(true);
              }
            }}
          >
            {isProposalsLoading ? (
              <Skeleton
                variant="text"
                width={100}
                sx={{ backgroundColor: 'rgba(177,177,177,0.17)' }}
              />
            ) : proposals.length !== 0 && selectedProposal !== undefined ? (
              <>
                <ProposalNumber proposal={selectedProposal} />
                <KeyboardArrowDownRounded fontSize="small" color="secondary" />
              </>
            ) : proposals.length === 0 ? (
              <Typography
                variant="body1"
                sx={{ color: theme.palette.secondary.main }}
              >
                There are no proposals
              </Typography>
            ) : (
              <Typography
                variant="body1"
                sx={{ color: theme.palette.secondary.main }}
              >
                Please select a proposal
              </Typography>
            )}
          </Box>
        </Box>
        {selectedProposal && (
          <Box sx={{ display: 'grid', gridAutoFlow: 'column' }}>
            <Box
              sx={{
                display: 'grid',
                justifyItems: 'center',
                width: 'fit-content',
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bolder' }}
                  component="span"
                >
                  Proposal ID:{' '}
                </Typography>
                <Typography variant="body2" component="span">
                  {selectedProposal?.proposal_id}
                </Typography>
              </Box>
              <Typography
                sx={{ color: theme.palette.secondary.main }}
                variant="overline"
              >
                {`${formatDate(new Date(selectedProposal.start_date), {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })} - ${
                  selectedProposal.end_date
                    ? formatDate(new Date(selectedProposal.end_date), {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'now'
                }`}
              </Typography>{' '}
            </Box>
            <Box
              sx={{
                display: 'grid',
                width: 'fit-content',
                gridAutoFlow: 'column',
                alignItems: 'center',
                columnGap: theme.spacing(1),
                justifySelf: 'end',
              }}
            >
              <Box
                sx={{
                  height: '20px',
                  width: '20px',
                  borderRadius: '100%',
                  backgroundColor: selectedProposal.is_ongoing
                    ? theme.palette.secondary.main
                    : theme.palette.warning.main,
                }}
              />
              <Typography>
                {selectedProposal.is_ongoing ? 'Ongoing' : 'Closed'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      {selectedProposal && (
        <Typography
          sx={{
            backgroundColor: 'black',
            padding: theme.spacing(3),
            textAlign: 'center',
          }}
        >
          {selectedProposal.is_ongoing
            ? 'Select a validator in the list below and vote for as the next validator to delegate to'
            : 'Below is the list of validators that particapted in this proposal'}
        </Typography>
      )}
      <Box
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
        }}
      >
        <Grid
          container
          columnSpacing={2}
          sx={{
            padding: `${theme.spacing(0.5)} ${theme.spacing(5)}`,
            background: theme.palette.secondary.main,
          }}
        >
          {tableHeaders.map(({ title, gridSpace }, index) => (
            <Grid
              item
              desktop={gridSpace}
              key={index}
              sx={{
                display: index === 0 ? 'initial' : 'grid',
                justifyItems: 'center',
              }}
            >
              <Typography sx={{ fontWeight: 'bold' }}>{title}</Typography>
            </Grid>
          ))}
        </Grid>
        <Scrollbars autoHide>
          {isLoadingProposalData ? (
            [...new Array(122)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  padding: `${theme.spacing(0.5)} ${theme.spacing(5)}`,
                }}
              >
                <Skeleton
                  height={40}
                  variant="rectangular"
                  sx={{
                    backgroundColor: 'rgba(177,177,177,0.17)',
                  }}
                />
              </Box>
            ))
          ) : validators.length > 0 ? (
            validators.map((validator, index) => (
              <ValidatorLIne
                key={index}
                isSubmittingVote={isSubmittingVote}
                validator={validator}
                isProposalOngoing={
                  selectedProposal ? selectedProposal.is_ongoing : false
                }
                onVote={(validator: Validator) => {
                  setSelectedValidator(validator);
                  setIsValidatorVoteDialogOpen(true);
                }}
              />
            ))
          ) : (
            <Typography sx={{ textAlign: 'center' }}>
              No Validators in this proposal
            </Typography>
          )}
        </Scrollbars>
        {selectedValidator && selectedProposal && (
          <VoteDialog
            closeDialog={() => setIsValidatorVoteDialogOpen(false)}
            isDialogOpen={isValidatorVoteDialogOpen}
            proposal={selectedProposal}
            validator={selectedValidator}
            submitVote={(selectedGems: inglGem[]) =>
              voteValidator(selectedGems)
            }
          />
        )}
      </Box>
    </Box>
  );
}
export default injectIntl(Dao);
