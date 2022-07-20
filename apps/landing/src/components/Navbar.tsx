import { useState, cloneElement } from 'react';
import AppBar from '@mui/material/AppBar';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Box from '@mui/material/Box';
import Logo from '../assets/logo.png';
import theme from '../theme/theme';
import { Button, IconButton, SwipeableDrawer, Tooltip } from '@mui/material';
import NavItem, { ExternalNavItem } from './NavItem';
import { MenuRounded } from '@mui/icons-material';

interface Props {
  children: React.ReactElement;
}

function ElevationScroll(props: Props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return cloneElement(children, {
    elevation: trigger ? 4 : 0,
  });
}

const NAV_LINKS: { name: string; link: string; isExternal: boolean }[] = [
  {
    name: 'Whitepaper',
    link: 'https://whitepaper.dsoldao.io',
    isExternal: true,
  },
  { name: 'Join our discord', link: 'https://discord.com', isExternal: true },
  { name: 'Explore', link: '/', isExternal: false },
];

export default function Navbar() {
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(true);
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
        gridTemplateRows: 'auto auto auto 1fr',
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
    </Box>
  );

  return (
    <>
      <ElevationScroll>
        <AppBar
          color="inherit"
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
            <img src={Logo} height="100%" alt="ingl logo" />
          </Box>
          <Box
            sx={{
              display: { laptop: 'grid', mobile: 'none' },
              gridTemplateColumns: 'auto auto auto',
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
                <ExternalNavItem link={{ link, name }} />
              )
            )}
          </Box>
          <Button
            color="primary"
            variant="contained"
            component="a"
            href='https://app.ingl.io/mint'
            rel="noreferrer"
            target="_blank"      
            sx={{
              borderRadius: '90px',
              justifySelf: 'end',
              display: { laptop: 'initial', mobile: 'none' },
            }}
          >
            Get Started
          </Button>
          <IconButton
            onClick={toggleDrawer}
            sx={{ display: { laptop: 'none', mobile: 'initial' } }}
          >
            <Tooltip arrow title="menu">
              <MenuRounded color="secondary" />
            </Tooltip>
          </IconButton>
        </AppBar>
      </ElevationScroll>

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
