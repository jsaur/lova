import theme from './theme';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    primaryBtn: {
      backgroundColor: theme.palette.primary.main,
      textTransform: 'none',
      borderRadius: '15px',
      boxShadow: 'none',
      width: '100%',
      '&:hover': {
        background: "#2FA06A",
        boxShadow: 'none',
      }
    },
    arrowButton: {
      backgroundColor: 'white',
      borderRadius: '15px',
      color: theme.palette.secondary.main,
      boxShadow: 'none',
      padding: '8px',
      minWidth: 'auto',
      '&:hover': {
        background: "#2FA06A",
        color: 'white',
      }
    },
    linkBtn:  {
      color: theme.palette.primary.main,
      textTransform: 'none',
      textDecoration: 'underline',
      fontWeight: 'bold',
    },
    modalWrapper: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      backgroundColor: '#FFFFFF',
      border: '2px solid #000',
      p: 4,
      padding: '25px',
    },
    bigTitle: {
      fontWeight: 'bold',
      letterSpacing: 0,
    },
    smallerTitle: {
      fontWeight: 'bold',
    },
    mainCaption: {
      color: '#4E4B66',
      fontSize: '0.9rem',
    }
  });

  export default useStyles;
  