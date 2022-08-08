import { CallMadeRounded } from '@mui/icons-material';
import { lighten, styled, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import theme from '../../theme/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NavItem: any = styled(NavLink)(() => ({
  ...theme.typography.h1,
//   fontSize: theme.spacing(2.5),
  color: 'white',
  transition: 'color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
  position: 'relative',
  marginInline: '4px',
  textDecoration: 'none',
  height: 'fit-content',
  justifySelf: 'center',
  '&::after': {
    position: 'absolute',
    bottom: '-11px',
    left: '0px',
    right: '0px',
    transform: 'scaleX(1.25)',
    content: '""',
    height: '0px',
    backgroundColor: theme.palette.secondary.main,
    borderRadius: '100px 100px 0px 0px',
  },
  '&:hover': {
    color: lighten(theme.palette.secondary.main, 0.3),
  },
  '&:hover::after': {},
  '&.active': {
    color: theme.palette.secondary.main,
  },
  '&.active::after': {
    height: '4px',
  },
}));

const ExternalNavItem = ({
  link: { link, name },
}: {
  link: { link: string; name: string };
}) => {
  return (
    <Typography
      component="a"
      href={link}
      rel="noreferrer"
      target="_blank"
      sx={{
        ...theme.typography.h1,
        fontSize: {mobile:'0.8rem', laptop:'1.25rem'},
        color: 'white',
        transition: 'color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        position: 'relative',
        marginInline: '4px',
        textDecoration: 'none',
        height: 'fit-content',
        justifySelf: 'center',
        display: 'grid',
        alignItems: 'baseline',
        gridAutoFlow: 'column',
        '&::after': {
          position: 'absolute',
          bottom: '-11px',
          left: '0px',
          right: '0px',
          transform: 'scaleX(1.25)',
          content: '""',
          height: '0px',
          backgroundColor: theme.palette.secondary.main,
          borderRadius: '100px 100px 0px 0px',
        },
        '&:hover': {
          color: lighten(theme.palette.secondary.main, 0.3),
        },
        '& .icon': { visibility: 'hidden' },
        '&:hover .icon': {
          visibility: 'visible',
        },
        '&:hover::after': {},
        '&.active': {
          color: theme.palette.secondary.main,
        },
        '&.active::after': {
          height: '4px',
        },
      }}
    >
      {name}
      <CallMadeRounded
        className="icon"
        sx={{fontSize:15}}
      />
    </Typography>
  );
};
export { ExternalNavItem };

export default NavItem;
