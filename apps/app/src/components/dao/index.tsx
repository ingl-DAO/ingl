import { KeyboardArrowDownRounded, ReportRounded } from '@mui/icons-material';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import Scrollbars from 'rc-scrollbars';
import { useEffect, useState } from 'react';
import { injectIntl, IntlShape } from 'react-intl';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import theme from '../../theme/theme';
import InglNumber from './inglNumber';
import ProposalNumber from './ProposalNumber';
import ProposalSelectionMenu from './ProposalSelectionMenu';
import ValidatorLIne from './ValidatorLIne';
import VoteDialog, { inglGem } from './VoteDialog';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  getGlobalGemData,
  getProposalsData,
  getValidatorsDetail,
  voteValidatorProposal,
} from '../../services/validator-dao.service';
import { PublicKey } from '@solana/web3.js';
export interface InglSummary {
  title: 'counter' | 'total_raised' | 'pd_pool_total' | 'delegated_total';
  amount: number;
  displayTitle: string;
}

export interface Proposal {
  proposal_id: string;
  start_date: Date;
  end_date?: Date | undefined;
  is_ongoing: boolean;
  proposal_numeration: number;
  winner: string | undefined;
  votes: number[];
  validator_ids: string[];
}

export interface Validator {
  validator_pub_key: string;
  skip_rate: number;
  solana_cli: string;
  av_distance: number;
  asn: string;
  asn_concentration: number;
  score: number;
  vote_account?: string;
  total_vote?: number;
  is_winner?: boolean;
  validator_index?: number;
}

function Dao({ intl: { formatDate } }: { intl: IntlShape }) {
  const { connection } = useConnection();
  const notif = new useNotification();

  const wallet = useWallet();

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

  const loadProposals = async () => {
    setIsProposalsLoading(true);
    const notif = new useNotification();
    getProposalsData(connection)
      .then((proposals: any) => {
        const newProposals: Proposal[] = proposals.map(
          (proposal: any, index: number) => {
            return {
              proposal_id: proposal?.proposal_pubkey.toString(),
              start_date: proposal?.data?.date_created * 1000,
              end_date: proposal?.data?.date_finalized
                ? proposal?.data?.date_finalized * 1000
                : undefined,
              votes: proposal?.data?.votes,
              winner: proposal?.data?.winner
                ? new PublicKey(proposal?.data?.winner).toString()
                : undefined,
              validator_ids: proposal?.data?.validator_ids,
              is_ongoing:
                index === proposals.length - 1 &&
                !proposal?.data?.date_finalized
                  ? true
                  : false,
              proposal_numeration: index + 1,
            };
          }
        );
        setProposals(newProposals);
        const newSelectedProposal = proposals.find(
          (proposal: Proposal) => proposal.is_ongoing
        );
        if (newSelectedProposal) {
          setSelectedProposal(newSelectedProposal);
        } else if (newProposals.length > 0) {
          setSelectedProposal(
            newProposals.sort((propA, propB) => {
              return new Date(propA.start_date) > new Date(propB.start_date)
                ? -1
                : 1;
            })[0]
          );
        }
      })
      .catch((error) => {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={loadProposals}
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
      })
      .finally(() => setIsProposalsLoading(false));
  };

  const loadStats = async () => {
    setIsInglNumbersLoading(true);
    const data = await getGlobalGemData(connection);
    setInglNumbers([
      {
        title: 'counter',
        amount: data.counter,
        displayTitle: 'Total Nfts Minted',
      },
      {
        title: 'total_raised',
        amount: data.total_raised,
        displayTitle: 'Total Raised (SOL)',
      },
      {
        title: 'pd_pool_total',
        amount: data.pd_pool_total,
        displayTitle: 'Pending Delegation (SOL)',
      },
      {
        title: 'delegated_total',
        amount: data.delegated_total,
        displayTitle: 'Total Delegated (SOL)',
      },
    ]);
    setIsInglNumbersLoading(false);
  };

  const [validators, setValidators] = useState<Validator[]>([]);
  const [isLoadingProposalData, setIsLoadingProposalData] =
    useState<boolean>(true);
  useEffect(() => {
    //TODO: FETCH DATA OF THE selected proposal here
    if (selectedProposal) {
      const notif = new useNotification();
      setIsLoadingProposalData(true);
      const validatorStats: Validator[] = [];
      getValidatorsDetail(selectedProposal.validator_ids)
        .then((validators) => {
          validators.forEach((validator, index) => {
            validatorStats.push({
              validator_index: index,
              validator_pub_key: validator.pubkey,
              asn: validator.details?.autonomous_system_number,
              asn_concentration: validator.details?.autonomous_system_number
                ? validator.details?.asn_concentration.toFixed(3)
                : null,
              av_distance: Number(
                (validator.details?.average_distance / 1000).toFixed(3)
              ),
              score: 60,
              skip_rate:
                Number(validator.details?.skipped_slot_percent ?? 0) * 100,
              solana_cli: validator.details?.software_version,
              total_vote: selectedProposal.votes[index],
              is_winner: selectedProposal.winner === validator.pubkey,
            });
          });
          setValidators(validatorStats);
          setIsLoadingProposalData(false);
        })
        .catch((error) =>
          notif.update({
            type: 'ERROR',
            render: (
              <ErrorMessage
                retryFunction={() => null}
                notification={notif}
                message={
                  error?.message ||
                  "There was a problem revealing your gem's rarity"
                }
              />
            ),
            autoClose: false,
            icon: () => <ReportRounded fontSize="large" color="error" />,
          })
        )
        .finally(() => setIsLoadingProposalData(false));
    }
  }, [selectedProposal]);

  useEffect(() => {
    //TODO: FETCH DATA WITH RESPECT to the different proposals
    loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    //TODO: FETCH DATA HERE WITH RESPECT inglNumbers
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    voteValidatorProposal(
      { connection, wallet },
      selectedGems.map((gem) => new PublicKey(gem.nft_id)),
      selectedValidator?.validator_index as number
    )
      .then((data) => {
        notif.update({
          render: 'Vote submitted successfully',
        });
      })
      .catch((error) => {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={() => voteValidator(selectedGems)}
              notification={notif}
              //TODO: this message is that coming from the backend
              message={
                error?.message || 'There was a problem submitting your vote'
              }
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
      })
      .finally(() => {
        setIsSubmittingVote(false);
      });
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
              if (
                !isProposalsLoading &&
                proposals.length > 0 &&
                !isSubmittingVote
              ) {
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
              <Typography sx={{ fontWeight: 'bold' }}>
                {title === 'Actions' && selectedProposal?.is_ongoing === false
                  ? 'Total Votes'
                  : title}
              </Typography>
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
                  if (selectedProposal?.is_ongoing && !wallet.connected) {
                    alert('Connect your wallet to vote');
                  } else {
                    setSelectedValidator(validator);
                    setIsValidatorVoteDialogOpen(true);
                  }
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
