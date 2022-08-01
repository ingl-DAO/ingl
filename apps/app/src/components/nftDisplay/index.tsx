import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  PriorityHighRounded,
  ReportRounded,
} from '@mui/icons-material';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import moment from 'moment';
import { useState } from 'react';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import random from '../../common/utils/random';
import theme from '../../theme/theme';
import SectionTitle from '../layout/SectionTitle';
import ActionDialog from './ActionDialog';
import Gem from './Gem';
import MintGemDialog from './MintGemDialog';
import SelectValidatorDialog from './SelectValidatorDialog';

export interface inglGem {
  nft_id: string;
  image_ref: string;
  generation: number;
  rarity?: string;
  gemClass: string;
  allocation_date?: string | Date;
  is_allocated: boolean;
  is_delegated: boolean;
  has_loan: boolean;
  rarity_reveal_date?: string | Date;
}

export interface dialogContent {
  title: string;
  content: string;
  agreeText: string;
  agreeFunction: () => void;
}

export enum NftClass {
  Ruby,
  Diamond,
  Sapphire,
  Emerald,
  Serendibite,
  Benitoite,
}

export default function NftDisplay() {
  const [mintPrice, setMintPrice] = useState<number>(10);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClose = () => {
    setIsMenuOpen(false);
    setAnchorEl(null);
  };
  interface nftOption {
    attName?: 'is_redeemable' | 'is_allocated' | 'is_delegated';
    dispName: string;
  }

  const nftOptions: nftOption[] = [
    { dispName: 'all' },
    { attName: 'is_redeemable', dispName: 'Redeemable' },
    { attName: 'is_allocated', dispName: 'Allocated' },
    { attName: 'is_delegated', dispName: 'Delegated' },
  ];

  const [selectedAttribute, setSelectedAttribute] = useState<nftOption>({
    dispName: 'all',
  });
  const selectNftAttribute = (option: nftOption) => {
    setSelectedAttribute(option);
    handleClose();
  };

  const sortNft = (
    nfts: inglGem[],
    selectionAttribute?: 'is_delegated' | 'is_allocated' | 'is_redeemable'
  ) => {
    if (selectionAttribute === undefined) return nfts;
    if (
      selectionAttribute !== 'is_redeemable' &&
      selectionAttribute !== undefined
    )
      return nfts.filter((nft) => nft[selectionAttribute] === true);
    else {
      return nfts.filter(
        ({ is_allocated, allocation_date, is_delegated }) =>
          (!is_allocated ||
            (allocation_date !== undefined &&
              moment().diff(moment(allocation_date), 'years', true) >= 2)) &&
          !is_delegated
      );
    }
  };

  const gems: inglGem[] = [
    {
      image_ref:
        'https://i2.wp.com/static.highsnobiety.com/thumbor/fv3lCYCfr6qZwmnh0eDHGzy_Xf4=/1600x1067/static.highsnobiety.com/wp-content/uploads/2021/04/24104434/chadwick-boseman-nft-art-01.jpg',
      nft_id: 'helloworld',
      generation: 1,
      gemClass: 'Sapphire',
      is_allocated: true,
      is_delegated: false,
      has_loan: false,
      allocation_date: new Date(),
    },
    {
      image_ref:
        'https://i2.wp.com/static.highsnobiety.com/thumbor/fv3lCYCfr6qZwmnh0eDHGzy_Xf4=/1600x1067/static.highsnobiety.com/wp-content/uploads/2021/04/24104434/chadwick-boseman-nft-art-01.jpg',
      nft_id: 'helloworlds',
      generation: 1,
      gemClass: 'Sapphire',
      is_allocated: false,
      is_delegated: true,
      has_loan: true,
    },
  ];

  const [isValidatorDialogOpen, setIsValidatorDialogOpen] =
    useState<boolean>(false);
  const [toDelegateNft, setToDelegateNft] = useState<string>();

  const openDelegationDialog = (nft_id: string) => {
    setToDelegateNft(nft_id);
    setIsValidatorDialogOpen(true);
  };

  const [selectedValidatorId, setSelectedValidaorId] = useState<string>();
  const getValidatorId = (validatorId: string) => {
    setSelectedValidaorId(validatorId);
    if (toDelegateNft) activateDialog('delegate', toDelegateNft);
    else {
      const notif = new useNotification();
      notif.notify({ render: 'Delegating your nft' });
      notif.update({
        type: 'INFO',
        render: 'Select an nft to proceed',
        autoClose: 5000,
        icon: () => <PriorityHighRounded color="error" />,
      });
    }
  };

  const [activeGemDialogContent, setActiveGemDialogContent] =
    useState<dialogContent>();
  const [isGemDialogOpen, setIsGemDialogOpen] = useState<boolean>(false);
  const activateDialog = (
    action:
      | 'redeem'
      | 'take loan'
      | 'allocate'
      | 'deallocate'
      | 'delegate'
      | 'undelegate',
    nft_id: string
  ) => {
    const dialogContents: Record<
      | 'redeem'
      | 'take loan'
      | 'allocate'
      | 'deallocate'
      | 'delegate'
      | 'undelegate',
      dialogContent
    > = {
      redeem: {
        title: 'Redeem Gem',
        content:
          "are you sure you want to redeem this gem? Note that this will remove it from your list of nft's forever. Do you still want to continue?",
        agreeText: 'Redeem',
        agreeFunction: () => executeAction(action, nft_id),
      },
      'take loan': {
        title: 'Take Loan',
        content:
          'Are you sure you want to take a loan on this gem? this will prevent you from redeeming the nft should you want to. But also, you will have to pay 10% of the loan every month. Do you still want to continue?',
        agreeText: 'Take Loan',
        agreeFunction: () => executeAction(action, nft_id),
      },
      allocate: {
        title: 'Allocate Gem',
        content:
          "are you sure you want to allocate this gem? Note that this action will reveal the gem's rarity and will lock your gem from redemption for a period of at least 2 (two) years. Are you want to continue?",
        agreeText: 'Allocate',
        agreeFunction: () => executeAction(action, nft_id),
      },
      deallocate: {
        title: 'Deallocate Gem',
        content:
          "Are you sure you want to deallocate this gem? Note that in case you do not intend to redeem this gem, next time you'll want to delegate, the nft will go through the lock period again. Do you still want to continue?",
        agreeText: 'Deallocate',
        agreeFunction: () => executeAction(action, nft_id),
      },
      delegate: {
        title: 'Delegate Gem',
        content:
          "Are you sure you want to delegate your funds to this validator? Not that we're not liable for any issue with the validator in case of non-productivity. Do you still want to continue?",
        agreeText: 'Delegate',
        agreeFunction: () => executeAction(action, nft_id),
      },
      undelegate: {
        title: 'Undelegate Gem',
        content:
          'are you sure you want to undelegate this gem? This action will prevent you from getting any benefits from your gem. Do you still want to continue?',
        agreeText: 'Undelegate',
        agreeFunction: () => executeAction(action, nft_id),
      },
    };

    setActiveGemDialogContent(dialogContents[action]);
    setIsGemDialogOpen(true);
  };

  const [actionNotifs, setActionNotifs] = useState<
    {
      notif: useNotification;
      action:
        | 'redeem'
        | 'take loan'
        | 'allocate'
        | 'deallocate'
        | 'delegate'
        | 'undelegate';
      isExecuting: boolean;
      nft_id: string;
    }[]
  >();

  const executeAction = (
    action:
      | 'redeem'
      | 'take loan'
      | 'allocate'
      | 'deallocate'
      | 'delegate'
      | 'undelegate',
    nft_id: string
  ) => {
    if (actionNotifs)
      setActionNotifs(
        actionNotifs?.filter((publishedNotif) => {
          const { action: notifAction, nft_id: notifNft_id } = publishedNotif;
          if (notifAction === action && nft_id === notifNft_id) {
            publishedNotif.notif.dismiss();
          }
          return notifAction !== action || nft_id !== notifNft_id;
        })
      );
    const notif = new useNotification();
    if (actionNotifs)
      setActionNotifs([
        ...actionNotifs,
        { action, nft_id, isExecuting: true, notif },
      ]);
    else setActionNotifs([{ action, nft_id, isExecuting: true, notif }]);

    const notificationContent: Record<
      | 'redeem'
      | 'take loan'
      | 'allocate'
      | 'deallocate'
      | 'delegate'
      | 'undelegate',
      { executing: string; success: string; error: string }
    > = {
      redeem: {
        executing: 'Please wait while we redeem your gem for you',
        success: 'Gem successfully redeemed',
        error: 'There was an error redeeming your gem. Please try again',
      },
      'take loan': {
        executing: 'Please wait while we compute and give you your loan',
        success: 'Loan sucessfully allocated',
        error: 'There was an allocating the loan. Please try again',
      },
      allocate: {
        executing: 'Please wait while we allocate your gem',
        success: 'Gem sucessfully allocated',
        error: 'There was an allocating the Gem. Please try again',
      },
      deallocate: {
        executing: 'Please wait while we deallocate your gem',
        success: 'Gem sucessfully deallocated',
        error: 'There was an deallocating the Gem. Please try again',
      },
      delegate: {
        executing: 'Please wait while we delegate your gem',
        success: 'Gem sucessfully delegated',
        error: 'There was an delegating the Gem. Please try again',
      },
      undelegate: {
        executing: 'Please wait while we undelegate your gem',
        success: 'Gem sucessfully undelegated',
        error: 'There was an undelegating the Gem. Please try again',
      },
    };
    notif.notify({ render: notificationContent[action].executing });
    setTimeout(() => {
      if (random() > 5) {
        // TODO CALL API HERE TO  REDEEM, TAKE LOAN, ALLOCATE, DEALLOCATE, DELEGATE, UNDELEGATE with data nft_id if the action is delegate then use the selectedValidatorId
        notif.update({
          render: notificationContent[action].success,
        });
        setActionNotifs(
          actionNotifs?.filter((publishedNotif) => {
            const { action: notifAction, nft_id: notifNft_id } = publishedNotif;
            if (notifAction === action && nft_id === notifNft_id) {
              publishedNotif.notif.dismiss();
            }
            return notifAction !== action || nft_id !== notifNft_id;
          })
        );
      } else {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={() => executeAction(action, nft_id)}
              notification={notif}
              closeFunction={() => {
                setActionNotifs(
                  actionNotifs?.filter((publishedNotif) => {
                    const { action: notifAction, nft_id: notifNft_id } =
                      publishedNotif;
                    if (notifAction === action && nft_id === notifNft_id) {
                      publishedNotif.notif.dismiss();
                    }
                    return notifAction !== action || nft_id !== notifNft_id;
                  })
                );
                notif.dismiss();
              }}
              //TODO: this message is that coming from the backend
              message={notificationContent[action].error}
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
      }
      setIsMintingGem(false);
    }, 3000);
  };

  const [notifs, setNotifs] = useState<useNotification[]>();
  const [isMintingGem, setIsMintingGem] = useState<boolean>(false);
  const mintGem = (mintClass: NftClass) => {
    if (notifs) notifs.forEach((publishedNotif) => publishedNotif.dismiss());
    const notif = new useNotification();
    if (notifs) setNotifs([...notifs, notif]);
    else setNotifs([notif]);
    notif.notify({ render: `Minting your awesome nft` });
    setIsMintingGem(true);

    setTimeout(() => {
      if (random() > 5) {
        // TODO CALL API HERE TO  MINT NFT with class mintClass
        notif.update({
          render: 'ingl Gem minted successfully',
        });
      } else {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={() => mintGem(mintClass)}
              notification={notif}
              //TODO: this message is that coming from the backend
              message="There was a problem minting your ingl Gem."
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
      }
      setIsMintingGem(false);
    }, 3000);
  };

  const displayGems = sortNft(gems, selectedAttribute.attName);
  const [isMintDialogOpen, setIsMintDialogOpen] = useState<boolean>(false);

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {laptop:'auto 1fr', mobile:'auto'},
          justifyItems: {laptop:'initial', mobile:'center'},
          alignItems: 'center',
          padding: theme.spacing(5.875),
          borderBottom: `1px solid ${theme.common.line}`,
        }}
      >
        <SectionTitle noMargin title="mint nft" />
        <Button
          color="secondary"
          variant="contained"
          size="large"
          sx={{ borderRadius: '90px', width: 'fit-content', justifySelf:{laptop:'end', mobile:'center'} }}
          onClick={() => setIsMintDialogOpen(true)}
          disabled={isMintingGem || isMintDialogOpen}
        >
          Mint now
        </Button>
        <MintGemDialog
          closeDialog={() => setIsMintDialogOpen(false)}
          onValidate={(mintClass: NftClass) => mintGem(mintClass)}
          isDialogOpen={isMintDialogOpen}
        />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SectionTitle title="my nft collection " center />
        <Button
          sx={{ color: 'white' }}
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            setIsMenuOpen(true);
          }}
          size="large"
          endIcon={
            isMenuOpen ? (
              <KeyboardArrowUpRounded sx={{ color: 'white' }} />
            ) : (
              <KeyboardArrowDownRounded sx={{ color: 'white' }} />
            )
          }
        >
          {selectedAttribute.dispName}
        </Button>
        {/* <SectionTitle title=" )" center /> */}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        elevation={0}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 'transparent',
          },
        }}
      >
        {nftOptions.map((item, index) => (
          <MenuItem dense onClick={() => selectNftAttribute(item)} key={index}>
            {item.dispName}
          </MenuItem>
        ))}
      </Menu>
      <Box
        sx={{
          color: 'white',
          display: 'grid',
          justifyItems: 'start',
          justifyContent:'center',
          gridTemplateColumns:
            displayGems.length === 0
              ? 'auto'
              : {
                  laptop: 'repeat(auto-fit, minmax(300px, 300px))',
                  mobile: 'repeat(auto-fit, minmax(150px, 150px))',
                },
          columnGap: '53px',
          rowGap: '20px',
        }}
      >
        {displayGems.length === 0 ? (
          selectedAttribute.attName ? (
            <Typography variant="h5" sx={{ textAlign: 'center' }}>
              You own now ingl gem that respects this criteria
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                justifyItems: 'center',
                rowGap: theme.spacing(2),
              }}
            >
              <Typography variant="h3" sx={{ textAlign: 'center' }}>
                You own no ingl gem at the moment.
              </Typography>
              <Typography variant="h3" sx={{ textAlign: 'center' }}>
                To participate in validator creation, please start by
              </Typography>
              <Button
                variant="contained"
                size="large"
                color="secondary"
                onClick={() => setIsMintDialogOpen(true)}
                disabled={isMintingGem || isMintDialogOpen}
                sx={{ borderRadius: '90px' }}
              >
                minting a gem
              </Button>
            </Box>
          )
        ) : (
          displayGems.map((gem, index) => (
            <Gem
              gem={gem}
              key={index}
              activateDialog={activateDialog}
              openDelegationDialog={openDelegationDialog}
              isDialogOpen={
                isGemDialogOpen ||
                actionNotifs?.find(({ nft_id }) => nft_id === gem.nft_id) !==
                  undefined
              }
            />
          ))
        )}
        {activeGemDialogContent !== undefined ? (
          <ActionDialog
            dialogContent={activeGemDialogContent}
            isDialogOpen={isGemDialogOpen}
            closeDialog={() => {
              setIsGemDialogOpen(false);
              setActiveGemDialogContent(undefined);
            }}
          />
        ) : null}
        <SelectValidatorDialog
          isDialogOpen={isValidatorDialogOpen}
          closeDialog={() => setIsValidatorDialogOpen(false)}
          onValidate={getValidatorId}
        />
      </Box>
    </Box>
  );
}
