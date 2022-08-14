import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  PriorityHighRounded,
  ReportRounded,
} from '@mui/icons-material';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import moment from 'moment';
import { useEffect } from 'react';
import { useState } from 'react';
import ErrorMessage from '../../common/components/ErrorMessage';
import useNotification from '../../common/utils/notification';
import {
  allocateSol,
  deallocatedSol,
  loadInglGems,
  mintInglGem,
  redeemInglGem,
} from '../../services/nft.service';
import { Rarity } from '../../services/state';
import theme from '../../theme/theme';
import SectionTitle from '../layout/SectionTitle';
import ActionDialog from './ActionDialog';
import Gem from './Gem';
import MintGemDialog from './MintGemDialog';
import SelectValidatorDialog from './SelectValidatorDialog';

export interface inglGem {
  nft_id: string;
  image_ref?: string;
  video_ref?: string;
  generation?: number;
  rarity?: Rarity;
  gemClass?: string;
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
  const wallet = useWallet();
  const { connection } = useConnection();

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
  const [gems, setGems] = useState<inglGem[]>([]);
  const [isLoadingGems, setIsLoadingGems] = useState<boolean>(true);

  const loadGems = () => {
    const notif = new useNotification();
    if (wallet?.publicKey) {
      setIsLoadingGems(true);
      loadInglGems(connection, wallet.publicKey)
        .then((inglGems) => {
          setGems(inglGems);
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
        })
        .finally(() => setIsLoadingGems(false));
    } else {
      setIsLoadingGems(false);
    }
  };

  useEffect(() => {
    loadGems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.connected]);

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
          "Are you sure you want to redeem this gem? Note that this will remove it from your list of nft's forever. Do you still want to continue?",
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
          "Are you sure you want to allocate this gem? Note that this action will reveal the gem's rarity and will lock your gem from redemption for a period of at least 2 (two) years. Are you want to continue?",
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
          'Are you sure you want to undelegate this gem? This action will prevent you from getting any benefits from your gem. Do you still want to continue?',
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

  const notif = new useNotification();
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
    if (actionNotifs)
      setActionNotifs([
        ...actionNotifs,
        { action, nft_id, isExecuting: true, notif },
      ]);
    else setActionNotifs([{ action, nft_id, isExecuting: true, notif }]);
    const tokenMint = new PublicKey(nft_id);
    notif.notify({ render: notificationContent[action].executing });
    const actions: Record<
      | 'redeem'
      | 'take loan'
      | 'allocate'
      | 'deallocate'
      | 'delegate'
      | 'undelegate',
      () => Promise<void>
    > = {
      redeem: async () =>
        await redeemInglGem({ connection, wallet }, tokenMint),
      'take loan': async () => {
        console.log('take a loan');
      },
      allocate: async () =>
        await allocateSol({ connection, wallet }, tokenMint),
      deallocate: async () =>
        await deallocatedSol({ connection, wallet }, tokenMint),
      delegate: async () => {
        console.log('delegate');
      },
      undelegate: async () => {
        console.log('undelegate');
      },
    };

    actions[action]()
      .then(() => {
        notif.update({
          render: notificationContent[action].success,
        });
        loadGems();
        setActionNotifs(
          actionNotifs?.filter((publishedNotif) => {
            const { action: notifAction, nft_id: notifNft_id } = publishedNotif;
            if (notifAction === action && nft_id === notifNft_id) {
              publishedNotif.notif.dismiss();
            }
            return notifAction !== action || nft_id !== notifNft_id;
          })
        );
        setIsMintingGem(false);
      })
      .catch((error) => {
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
              message={error?.message || notificationContent[action].error}
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
        setIsMintingGem(false);
      });
  };

  const [notifs, setNotifs] = useState<useNotification[]>();
  const [isMintingGem, setIsMintingGem] = useState<boolean>(false);
  const mintGem = (nftClass: NftClass) => {
    if (notifs) notifs.forEach((publishedNotif) => publishedNotif.dismiss());
    const notif = new useNotification();
    if (notifs) setNotifs([...notifs, notif]);
    else setNotifs([notif]);
    notif.notify({ render: `Minting your awesome nft` });
    setIsMintingGem(true);

    mintInglGem(
      {
        connection,
        wallet,
      },
      nftClass
    )
      .then(() => {
        notif.update({
          render: 'ingl Gem minted successfully',
        });
        loadGems();
        setIsMintingGem(false);
      })
      .catch((error) => {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={() => mintGem(nftClass)}
              notification={notif}
              message={
                error?.message || 'There was a problem minting your ingl Gem.'
              }
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
        setIsMintingGem(false);
      });
  };

  const displayGems = sortNft(gems, selectedAttribute.attName);
  const [isMintDialogOpen, setIsMintDialogOpen] = useState<boolean>(false);

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { laptop: 'auto 1fr', mobile: 'auto' },
          justifyItems: { laptop: 'initial', mobile: 'center' },
          alignItems: 'center',
          padding: theme.spacing(5.875),
          // borderBottom: `1px solid ${theme.common.line}`,
        }}
      >
        <Typography
          variant="h1"
          component="span"
          sx={{
            color: theme.palette.secondary.main,
            textAlign: 'justify',
            fontSize: { mobile: '1.5rem', laptop: '2.125rem' },
          }}
        >
          MINT NFT
        </Typography>
        <Button
          color="secondary"
          variant="contained"
          size="large"
          sx={{
            borderRadius: '90px',
            width: 'fit-content',
            justifySelf: { laptop: 'end', mobile: 'center' },
          }}
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
        <Box
          sx={{
            marginBottom: theme.spacing(5.875),
            marginTop: theme.spacing(5.875),
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            component="span"
            sx={{
              color: 'white',
              textAlign: 'justify',
              fontSize: { mobile: '2rem', laptop: '3.125rem' },
            }}
          >
            MY NFT COLLECTION
          </Typography>
        </Box>
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
            backgroundColor: 'black',
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
          justifyContent: 'center',
          gridTemplateColumns:
            displayGems.length === 0
              ? 'auto'
              : {
                  laptop: 'repeat(auto-fit, minmax(300px, 300px))',
                  // mobile: 'repeat(auto-fit, minmax(150px, 150px))',
                },
          columnGap: '53px',
          rowGap: '20px',
        }}
      >
        {isLoadingGems ? (
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              color: theme.palette.secondary.main,
              fontStyle: 'italic',
            }}
          >
            Loading your NFTs...
          </Typography>
        ) : displayGems.length === 0 ? (
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
              setGems={setGems}
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
