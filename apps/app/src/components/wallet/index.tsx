import { PriorityHighRounded, ReportRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Scrollbars from 'rc-scrollbars';
import { useEffect, useState } from 'react';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import { claimInglRewards, loadRewards } from '../../services/nft.service';
import theme from '../../theme/theme';
import SectionTitle from '../layout/SectionTitle';
import ActionDialog from '../nftDisplay/ActionDialog';
import FinanceLine from './FinanceLine';
import NftRow from './NftRow';
import WalletTableHead from './TableHead';

export interface Gem {
  nft_id: string;
  image_ref: string;
  rewards: number;
  vote_account_id: string;
}

const maxClaimableNft = 100;

export default function Wallet() {
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState<boolean>(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState<boolean>(false);

  const [nfts, setNfts] = useState<Gem[]>([]);
  const [isNftsLoading, setIsNftsLoading] = useState<boolean>(true);

  const wallet = useWallet();
  const { connection } = useConnection();
  const notif = new useNotification();

  const loadNftRewards = (payerKey: PublicKey) => {
    setIsNftsLoading(true);
    loadRewards(payerKey, connection)
      .then((nfts) => {
        setNfts(nfts);
        setIsNftsLoading(false);
      })
      .catch((error) => {
        notif.update({
          type: 'ERROR',
          autoClose: 5,
          render: error,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
        setIsNftsLoading(false);
      });
  };
  useEffect(() => {
    if (wallet.publicKey) loadNftRewards(wallet.publicKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.publicKey]);

  const [notifs, setNotifs] = useState<useNotification[]>();
  const claimRewards = () => {
    setIsClaimDialogOpen(false);
    if (
      selectedGems.length > 0 &&
      selectedGems.reduce((total, item) => item.rewards + total, 0) > 0
    ) {
      if (notifs) notifs.map((publishedNotif) => publishedNotif.dismiss());
      if (notifs) setNotifs([...notifs, notif]);
      else setNotifs([notif]);
      notif.notify({ render: 'Claiming Rewards' });
      claimInglRewards(
        { connection, wallet },
        selectedGems.map(({ vote_account_id, nft_id }) => ({
          tokenMint: new PublicKey(nft_id),
          voteMint: new PublicKey(vote_account_id),
        }))
      )
        .then(() => {
          notif.update({
            render: 'Successfully claimed rewards',
          });
          setSelectedGems([]);
          setIsClaimingRewards(true);
          if (wallet.publicKey) loadNftRewards(wallet.publicKey);
        })
        .catch((error) => {
          notif.update({
            type: 'ERROR',
            render: (
              <ErrorMessage
                retryFunction={claimRewards}
                notification={notif}
                message={
                  error?.message ||
                  'There was a problem claiming your rewards. Please try again'
                }
              />
            ),
            autoClose: false,
            icon: () => <ReportRounded fontSize="large" color="error" />,
          });
        });
    } else {
      const notif = new useNotification();
      notif.notify({ render: 'Claiming your rewards' });
      notif.update({
        type: 'INFO',
        render: 'Select at least a gem with rewards greater than zero (0)',
        autoClose: 5000,
        icon: () => <PriorityHighRounded color="error" />,
      });
    }
  };

  const [selectedGems, setSelectedGems] = useState<Gem[]>([]);

  const selectNft = (nft: Gem) => {
    if (selectedGems.find((gem) => gem.nft_id === nft.nft_id)) {
      setSelectedGems(selectedGems.filter((gem) => gem.nft_id !== nft.nft_id));
    } else if (
      selectedGems.length === maxClaimableNft ||
      selectedGems.length === nfts.length
    )
      return;
    else setSelectedGems([...selectedGems, nft]);
  };

  const selectFirstHundred = () => {
    if (
      selectedGems.length === maxClaimableNft ||
      selectedGems.length === nfts.length
    )
      setSelectedGems([]);
    else {
      const sortedNfts = nfts.sort((el1, el2) =>
        el1.rewards > el2.rewards ? -1 : 1
      );
      setSelectedGems(sortedNfts.slice(0, maxClaimableNft));
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { laptop: 'auto 1fr', mobile: 'auto' },
          justifyItems: { laptop: 'initial', mobile: 'center' },
          alignItems: 'center',
          padding: theme.spacing(5.875),
          borderBottom: `4px solid ${theme.palette.secondary.dark}`,
        }}
      >
        <SectionTitle noMargin title="ingl Wallet" />
        <Button
          color="secondary"
          variant="contained"
          size="large"
          sx={{
            borderRadius: '90px',
            width: 'fit-content',
            justifySelf: { laptop: 'end', mobile: 'center' },
          }}
          onClick={() => setIsClaimDialogOpen(true)}
          disabled={isClaimingRewards || isClaimDialogOpen}
        >
          Claim rewards
        </Button>
        <ActionDialog
          closeDialog={() => setIsClaimDialogOpen(false)}
          isDialogOpen={isClaimDialogOpen}
          dialogContent={{
            title: 'Claim rewards?',
            agreeText: 'Claim',
            content: `With this action, you will claim rewards worth ${selectedGems.reduce(
              (total, item) => item.rewards + total,
              0
            )} SOL. Do you want to continue?`,
            agreeFunction: claimRewards,
          }}
        />
        <FinanceLine
          lineTitle="Total Claimable Rewards: "
          amount={nfts.reduce((total, item) => item.rewards + total, 0)}
        />
      </Box>
      <Box
        sx={{
          height: '100%',
          padding: '0 16px',
        }}
      >
        <FinanceLine
          lineTitle="Total Claimable at Once: "
          amount={selectedGems.reduce((total, item) => item.rewards + total, 0)}
        />
        <TableContainer style={{ height: '100%' }}>
          <Table size="small" sx={{ height: 'inherit' }}>
            <Scrollbars autoHide>
              <WalletTableHead
                isDisabled={
                  isNftsLoading || nfts.length === 0 || isClaimingRewards
                }
                onSelectAllClick={selectFirstHundred}
                isHundredSelected={
                  selectedGems.length === maxClaimableNft ||
                  selectedGems.length === nfts.length
                }
              />
              <TableBody>
                {nfts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      sx={{
                        '&.MuiTableCell-root': { border: 'none' },
                        textAlign: 'center',
                      }}
                    >
                      {isNftsLoading ? (
                        <Typography
                          sx={{
                            textAlign: 'center',
                            color: theme.palette.secondary.main,
                            fontStyle: 'italic',
                          }}
                        >
                          Loading delegated gems...
                        </Typography>
                      ) : (
                        <Typography>You have no delegated gems</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  nfts
                    .sort((el1, el2) => (el1.rewards > el2.rewards ? -1 : 1))
                    .map((nft, index) => (
                      <NftRow
                        key={index}
                        isChecked={
                          selectedGems.find(
                            (gem) => gem.nft_id === nft.nft_id
                          ) !== undefined
                            ? true
                            : false
                        }
                        selectNft={() => selectNft(nft)}
                        isClaimingDialog={isClaimingRewards}
                        isNftsLoading={isNftsLoading}
                        rowData={nft}
                      />
                    ))
                )}
              </TableBody>
            </Scrollbars>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
