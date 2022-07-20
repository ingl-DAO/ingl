import { DoneAllRounded } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { randomUUID as uuidv4 } from 'crypto';
import { Id, toast } from 'react-toastify';

export class useNotification {
  toastId: Id;
  constructor() {
    this.toastId = uuidv4();
  }
  notify = ({ render }: { render: string | JSX.Element }) =>
    (this.toastId = toast.info(render, {
      autoClose: false,
      closeButton: false,
      closeOnClick: false,
      icon: () => <CircularProgress thickness={3} size={20} />,
    }));

  dismiss = () => toast.dismiss(this.toastId);

  update = ({
    type,
    render,
    closeButton,
    hideProgressBar,
    autoClose,
    icon,
  }: {
    render?: string | JSX.Element;
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEFAULT' | 'INFO';
    autoClose?: false | number;
    closeButton?: false | JSX.Element;
    hideProgressBar?: boolean;
    icon?: JSX.Element | (() => JSX.Element);
  }) =>
    toast.update(this.toastId, {
      type: toast.TYPE[type ?? 'SUCCESS'],
      render: render ?? 'Success',
      closeButton: closeButton ?? false,
      hideProgressBar: hideProgressBar ?? true,
      autoClose: autoClose ?? 5000,
      closeOnClick: true,
      icon:
        icon !== undefined ? icon : () => <DoneAllRounded color="success" />,
    });
}

export default useNotification;
