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
import Scrollbars from 'rc-scrollbars';
import { useEffect, useState } from 'react';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import random from '../../common/utils/random';
import theme from '../../theme/theme';
import SectionTitle from '../layout/SectionTitle';
import ActionDialog from '../nftDisplay/ActionDialog';
import FinanceLine from './FinanceLine';
import NftRow from './NftRow';
import WalletTableHead from './TableHead';

interface Gem {
  nft_id: string;
  image_ref: string;
  rewards: number;
  validator_pub_key: string;
}

const maxClaimableNft = 100;

export default function Wallet() {
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState<boolean>(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState<boolean>(false);

  const [nfts, setNfts] = useState<Gem[]>([]);
  const [isNftsLoading, setIsNftsLoading] = useState<boolean>(true);
  useEffect(() => {
    //TODO: LOAD NFTS HERE
    setTimeout(() => {
      setNfts([
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worlds',
          rewards: 1000,
          nft_id: 's',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldd',
          rewards: 100,
          nft_id: 'd',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldf',
          rewards: 10,
          nft_id: 'f',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldg',
          rewards: 10000,
          nft_id: 'a',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
        {
          image_ref:
            'https://brand.zesty.io/zesty-io-logo-horizontal-light-color.svg',
          validator_pub_key: 'Hello worldh',
          rewards: 100000,
          nft_id: 'e',
        },
      ]);
      setIsNftsLoading(false);
    }, 3000);
  }, []);

  const [notifs, setNotifs] = useState<useNotification[]>();
  const claimRewards = () => {
    setIsClaimDialogOpen(false);
    //TODO: CALL API TO CLAIM REWARDS HERE
    if (
      selectedGems.length > 0 &&
      selectedGems.reduce((total, item) => item.rewards + total, 0) > 0
    ) {
      if (notifs) notifs.map((publishedNotif) => publishedNotif.dismiss());
      const notif = new useNotification();
      if (notifs) setNotifs([...notifs, notif]);
      else setNotifs([notif]);
      notif.notify({ render: 'Claiming Rewards' });
      setIsClaimingRewards(true);

      setTimeout(() => {
        if (random() > 5) {
          // TODO CALL API HERE TO  REVEAL NFT ID and after success, load the nfts again. without which you have to update the list of claimed nfts to 0 rewards
          notif.update({
            render: 'Successfully claimed rewards',
          });
          setSelectedGems([]);
        } else {
          notif.update({
            type: 'ERROR',
            render: (
              <ErrorMessage
                retryFunction={claimRewards}
                notification={notif}
                //TODO: this message is that coming from the backend
                message="There was a problem claiming your rewards. Please try again"
              />
            ),
            autoClose: false,
            icon: () => <ReportRounded fontSize="large" color="error" />,
          });
        }
        setIsClaimingRewards(false);
      }, 3000);
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
          borderBottom: `1px solid ${theme.common.line}`,
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
          backgroundColor: '#0d33345e',
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
                        '&.MuiTableCell-root': { borderBottom: '0px' },
                        textAlign: 'center',
                      }}
                    >
                      <Typography>You have no delegated gems</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  nfts
                    .sort((el1, el2) => (el1.rewards > el2.rewards ? -1 : 1))
                    .map((nft) => (
                      <NftRow
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
