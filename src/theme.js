import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#46BD84',
    },
    secondary: {
      main: '#FFDD7D',
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
