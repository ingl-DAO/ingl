import { useState } from 'react';
import Box from '@mui/material/Box';
import Logo from '../../assets/logo.png';
import theme from '../../theme/theme';
import { IconButton, SwipeableDrawer, Tooltip } from '@mui/material';
import NavItem, { ExternalNavItem } from './NavItem';
import { MenuRounded } from '@mui/icons-material';
import ConnectButton from './ConnectButton';
import { Link } from 'react-router-dom';
import { NotificationsButton } from '@dialectlabs/react-ui';
import './dialect.css';
const NAV_LINKS: { name: string; link: string; isExternal: boolean }[] = [
  {
    name: 'NFTS',
    link: '/nft',
    isExternal: false,
  },
  { name: 'DAO', link: '/dao', isExternal: false },
  { name: 'Wallet', link: '/wallet', isExternal: false },
  {
    name: 'Onboard Validator',
    link: 'https://whitepaper.ingl.io/components/onboarding-a-validator',
    isExternal: true,
  },
];

export default function Navbar() {
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);
  const toggleDrawer = (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }

    setIsSideBarOpen(!isSideBarOpen);
  };

  const SideNav = () => (
    <Box
      sx={{
        width: 250,
        backgroundColor: 'black',
        height: '100%',
        paddingTop: theme.spacing(5),
        display: 'grid',
        rowGap: theme.spacing(5),
        gridTemplateRows: 'auto auto auto auto auto 1fr',
      }}
      role="presentation"
      onClick={toggleDrawer}
      onKeyDown={toggleDrawer}
    >
      {NAV_LINKS.map(({ isExternal, link, name }, index) =>
        !isExternal ? (
          <NavItem
            to={link}
            sx={{ fontSize: { mobile: '0.8rem', laptop: '1.25rem' } }}
            key={index}
          >
            {name}
          </NavItem>
        ) : (
          <ExternalNavItem link={{ link, name }} />
        )
      )}
      <ConnectButton isSideNavElement={true} />
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#10141e',
          display: 'grid',
          gridTemplateColumns: {
            laptop: 'auto 1fr auto',
            mobile: '1fr auto',
          },
          alignItems: 'center',
          px: theme.spacing(8),
          py: theme.spacing(2.375),
        }}
      >
        <Box sx={{ height: { laptop: '59.88px', mobile: '40px' } }}>
          <Link to={'/'}>
            <img src={Logo} height="100%" alt="ingl logo" />
          </Link>
        </Box>
        <Box
          sx={{
            display: { laptop: 'grid', mobile: 'none' },
            gridTemplateColumns: 'auto auto auto auto',
            columnGap: theme.spacing(10),
            justifyContent: 'center',
          }}
        >
          {NAV_LINKS.map(({ isExternal, link, name }, index) =>
            !isExternal ? (
              <NavItem
                to={link}
                sx={{ fontSize: { mobile: '0.8rem', laptop: '1.25rem' } }}
                key={index}
              >
                {name}
              </NavItem>
            ) : (
              <ExternalNavItem key={index} link={{ link, name }} />
            )
          )}
        </Box>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsButton
            dialectId="dialect-notifications"
            notifications={[]}
            pollingInterval={15000}
            channels={['web3', 'email', 'sms', 'telegram']}
          />
          &nbsp; &nbsp; &nbsp;
          <ConnectButton />
        </Box>
        <IconButton
          onClick={toggleDrawer}
          sx={{ display: { laptop: 'none', mobile: 'initial' } }}
        >
          <Tooltip arrow title="menu">
            <MenuRounded color="secondary" />
          </Tooltip>
        </IconButton>
      </Box>

      <SwipeableDrawer
        anchor="left"
        open={isSideBarOpen}
        onClose={toggleDrawer}
        onOpen={toggleDrawer}
      >
        <SideNav />
      </SwipeableDrawer>
    </>
  );
}
