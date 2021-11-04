import * as React from 'react';
import Box from '@mui/material/Box';
import { Button } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Image from 'next/image';
import { makeStyles } from '@mui/styles';
import theme from '../src/theme';

const drawerWidth = 240;

const useStyles = makeStyles({
  sideBarBtn: {
    color: theme.palette.primary.main,
    marginLeft: '16px',
    marginRight: '16px',
    marginTop: '24px',
    marginBottom: '12px',
    boxShadow: 'none'
  },
  logoWrapper: {
    marginTop: '25px',
  },
});


export default function Sidebar() {
  const classes = useStyles();
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#46BD84',
            color: 'white',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar className={classes.logoWrapper}>
          <Image
            src="/img/lova_white_logo.png" // Route of the image file
            height={51.5}
            width={114}
            alt="logo"
          />
        </Toolbar>
        {/* <Button variant="contained" color="secondary" className={classes.sideBarBtn} onClick={() => {
          alert('clicked');
        }}
        >Connect to Wallet</Button>*/}
        
        <List>
          {['Home', 'Our Borrowers'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>
                {index % 2 === 0 ? <DashboardIcon /> : <FavoriteIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        
      </Drawer>
      
    </Box>
  );
}