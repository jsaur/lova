import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { makeStyles } from '@mui/styles';

const drawerWidth = 240;

const useStyles = makeStyles({
  drawerWrapper: {
    
  },
});

export default function Rightbar(props) {
  const classes = useStyles();
  return (
    <Box sx={{ display: 'flex'}}>
      <CssBaseline />
     
  
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            padding: '16px',
            paddingTop: '25px',
            backgroundColor: '#F3F3F3',
          },
        }}
        variant="permanent"
        anchor="right"
        className={classes.drawerWrapper}
      >
        {props.children}
      </Drawer>
    </Box>
  );
}
