import { MoreHorizRounded, ReportRounded } from '@mui/icons-material';
import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { inglGem } from '.';
import theme from '../../theme/theme';
import moment from 'moment';
import useNotification from '../../common/utils/notification';
import random from '../../common/utils/random';
import ErrorMessage from '../../common/components/ErrorMessage';
import ActionDialog from './ActionDialog';

export default function Gem({
  gem: {
    rarity,
    gemClass,
    rarity_reveal_date,
    generation,
    image_ref,
    video_ref,
    nft_id,
    is_allocated,
    is_delegated,
    has_loan,
    allocation_date,
  },
  isDialogOpen,
  activateDialog,
  openDelegationDialog,
}: {
  gem: inglGem;
  activateDialog: (
    action:
      | 'redeem'
      | 'take loan'
      | 'allocate'
      | 'deallocate'
      | 'delegate'
      | 'undelegate',
    nft_id: string
  ) => void;
  isDialogOpen: boolean;
  openDelegationDialog?: (nft_id: string) => void;
}) {
  const gemActions: {
    title: string;
    condition: boolean;
    dialogContent?: {
      title: string;
      content: string;
      agreeText: string;
      agreeFunction: () => void;
    };

    onClick: () => void;
  }[] = [
    {
      title: 'redeem',
      condition:
        ((!has_loan && !is_allocated) ||
          (allocation_date !== undefined &&
            moment().diff(moment(allocation_date), 'years', true) >= 2)) &&
        !is_delegated,
      onClick: () => {
        activateDialog('redeem', nft_id);
        closeMenu();
      },
    },
    {
      title: 'take loan',
      condition: !has_loan,
      onClick: () => {
        activateDialog('take loan', nft_id);
        closeMenu();
      },
    },
    {
      title: 'allocate',
      condition: !is_delegated && !is_allocated,
      onClick: () => {
        activateDialog('allocate', nft_id);
        closeMenu();
      },
    },
    {
      title: 'deallocate',
      condition:
        !is_delegated &&
        is_allocated &&
        allocation_date !== undefined &&
        moment().diff(moment(allocation_date), 'years', true) >= 2,
      onClick: () => {
        activateDialog('deallocate', nft_id);
        closeMenu();
      },
    },
    {
      title: 'delegate',
      condition: is_allocated && allocation_date !== undefined,
      onClick: () => {
        closeMenu();
        if (openDelegationDialog) openDelegationDialog(nft_id);
        // activateDialog('delegate', nft_id);
      },
    },
    {
      title: 'undelegate',
      onClick: () => {
        activateDialog('undelegate', nft_id);
        closeMenu();
      },
      condition: is_delegated,
    },
  ];

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setMenuAnchor(null);
  };

  const [isRevealingRarity, setIsRevealingRarity] = useState<boolean>(false);
  const [notifs, setNotifs] = useState<useNotification[]>();
  const revealRarity = () => {
    if (notifs) notifs.map((publishedNotif) => publishedNotif.dismiss());
    const notif = new useNotification();
    if (notifs) setNotifs([...notifs, notif]);
    else setNotifs([notif]);
    notif.notify({ render: "Revealing gem's rarity" });
    setIsRevealingRarity(true);

    setTimeout(() => {
      if (random() > 5) {
        // TODO CALL API HERE TO  REVEAL NFT ID
        notif.update({
          render: 'successfully revealed ingl gem rarity',
        });
      } else {
        notif.update({
          type: 'ERROR',
          render: (
            <ErrorMessage
              retryFunction={revealRarity}
              notification={notif}
              //TODO: this message is that coming from the backend
              message="There was a problem revealing your gem's rarity"
            />
          ),
          autoClose: false,
          icon: () => <ReportRounded fontSize="large" color="error" />,
        });
      }
      setIsRevealingRarity(false);
    }, 3000);
  };

  const [isRevealRarityDialogOpen, setIsRevealRarityDialogOpen] =
    useState<boolean>(false);

  return (
    <>
      <Box
        sx={{
          padding: theme.spacing(2),
          background:
            'linear-gradient(151.27deg, #042F57 10.17%, #00426B 32.86%, #015C74 65.73%, #02C39A 150.23%)',
          borderRadius: theme.spacing(3.75),
          width: 'fit-content',
        }}
      >
        <Box
          sx={{
            background: 'rgba(9, 44, 76, 0.6)',
            borderRadius: theme.spacing(2.5),
            position: 'relative',
            height: { laptop: '300px', mobile: '150px' },
            width: { laptop: '300px', mobile: '150px' },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: theme.palette.primary.dark,
              padding: '5px 7px',
              borderTopRightRadius: theme.spacing(2.5),
              borderBottomLeftRadius: theme.spacing(2.5),
            }}
          >
            {!rarity || !rarity_reveal_date ? (
              <Button
                variant="contained"
                color="secondary"
                disabled={isRevealingRarity}
                onClick={() => setIsRevealRarityDialogOpen(true)}
                sx={{
                  color: 'white',
                  borderRadius: '30px',
                  fontSize: { mobile: '0.55rem', laptop: 'initial' },
                }}
              >
                reveal rarity
              </Button>
            ) : (
              <Typography
                variant="h3"
                sx={{ fontSize: { laptop: 'initial', mobile: '0.80rem' } }}
              >
                {rarity}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              backgroundColor: theme.palette.primary.dark,
              padding: '5px 7px',
              borderTopRightRadius: theme.spacing(2.5),
              borderBottomLeftRadius: theme.spacing(2.5),
            }}
          >
            <Typography
              variant="h3"
              sx={{ fontSize: { laptop: 'initial', mobile: '0.80rem' } }}
            >
              {gemClass}
            </Typography>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              padding: '5px 7px',
              borderTopRightRadius: theme.spacing(2.5),
              borderBottomLeftRadius: theme.spacing(2.5),
            }}
          >
            <IconButton
              onClick={(event) => {
                setMenuAnchor(event.currentTarget);
                setIsMenuOpen(true);
              }}
            >
              <Tooltip arrow title="more">
                <MoreHorizRounded
                  sx={{
                    color: 'white',
                    fontSize: { laptop: '35px', mobile: '25px' },
                  }}
                />
              </Tooltip>
            </IconButton>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: theme.spacing(0.5),
              left: theme.spacing(0.5),
              backgroundColor: theme.palette.primary.dark,
              padding: '5px 7px',
              height: { mobile: '10px', laptop: '30px' },
              width: { mobile: '10px', laptop: '30px' },
              borderRadius: '30px',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { laptop: '1.5rem', mobile: '0.80rem' },
                textAlign: 'center',
              }}
            >
              {generation}
            </Typography>
          </Box>
          <video
            src={video_ref}
            playsInline
            autoPlay
            muted
            loop
            style={{
              objectFit: 'cover',
              height: '100%',
              width: '100%',
              borderRadius: theme.spacing(2.5)
            }}
            poster={image_ref}
          />
        </Box>
      </Box>
      <Menu
        anchorEl={menuAnchor}
        open={isMenuOpen}
        elevation={0}
        onClose={closeMenu}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 'black',
          },
        }}
      >
        {gemActions.map(({ title, condition, onClick }, index) =>
          condition ? (
            <MenuItem
              sx={{
                '&:hover': {
                  backgroundColor: isDialogOpen
                    ? 'black'
                    : theme.palette.secondary.light,
                },
              }}
              dense
              onClick={() => (isDialogOpen ? null : onClick())}
              key={index}
            >
              {title}
            </MenuItem>
          ) : null
        )}
      </Menu>
      <ActionDialog
        dialogContent={{
          // ...activeGemDialogContent,
          title: 'Reveal gem rarity',
          content:
            "Are you sure you want to reveal this gem's rarity? Not that this will prevent you from redeeming the total value of your gem for at least a year should you want to redeem in that period",
          agreeText: 'Reveal',
          agreeFunction: revealRarity,
        }}
        isDialogOpen={isRevealRarityDialogOpen}
        closeDialog={() => {
          setIsRevealRarityDialogOpen(false);
        }}
      />
    </>
  );
}
