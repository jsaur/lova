import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';

/**
 * Handles logic when a contract call is transacting by disabling the button and displaying a spinner
 */
export default function BorrowerCard(props) {
  return (
    <Button variant="contained" className={props.classes} onClick={props.onClick} disabled={props.transacting}>
      {props.transacting ? 
        (<CircularProgress color="inherit" size="1rem" />) 
        :
        (props.text)
      }
    </Button>
  );
}


