import { CircularProgress } from '@mui/material';

export default function Progress({
  color,
  thickness,
  size,
}: {
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'inherit'
    | 'info'
    | 'error';
  thickness?: number;
  size?: number;
}) {
  return (
    <CircularProgress
      color={color === undefined? "secondary" : color}
      thickness={thickness=== undefined?3 : thickness}
      size={size===undefined?25:size}
      sx={{ marginRight: '10px' }}
    />
  );
}
