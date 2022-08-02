import { Box, Button, Typography } from '@mui/material';
import Scrollbars from 'rc-scrollbars';
import { useEffect, useState } from 'react';
import theme from '../../theme/theme';
import SectionTitle from '../layout/SectionTitle';
import ActionDialog from '../nftDisplay/ActionDialog';
import FinanceLine from './FinanceLine';
import WalletTableHead from './TableHead';

export default function Wallet() {
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState<boolean>(false);
  const [isClaimingDialog, setIsClaimingDialog] = useState<boolean>(false);

  const [nfts, setNfts] = useState<{ rewards: number }[]>([]);
  const [isNftsLoading, setIsNftsLoading] = useState<boolean>(true);
  useEffect(() => {
    //TODO: LOAD NFTS HERE
    setTimeout(() => {
      setIsNftsLoading(false);
    }, 3000);
  }, []);

  const claimRewards = () => {
    //TODO: CALL API TO CLAIM REWARDS HERE
    return;
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
          disabled={isClaimingDialog || isClaimDialogOpen}
        >
          Claim rewards
        </Button>
        <ActionDialog
          closeDialog={() => setIsClaimDialogOpen(false)}
          isDialogOpen={isClaimDialogOpen}
          dialogContent={{
            title: 'Claim rewards?',
            agreeText: 'Claim',
            content: 'Do you want to claim these rewards now?',
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
          margin: theme.spacing(3),
          height: '95.6%',
          padding: '0 16px',
        }}
      >
        <Scrollbars>
          <FinanceLine
            lineTitle="Total Rewards: "
            amount={nfts.reduce((total, item) => item.rewards + total, 0)}
          />
          <WalletTableHead
            isDataLoading={false}
            isSubmittingExamSuccess={false}
            numSelected={6}
            onSelectAllClick={() => {
              console.log('hello');
            }}
            rowCount={6}
            showResult={() => true}
          />
        </Scrollbars>
      </Box>
    </Box>
  );
}
