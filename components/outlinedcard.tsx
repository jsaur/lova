import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  boxWrapper: {
    padding: '25px',
  },
  cardWrapper: {
    background: 'linear-gradient(321.69deg, #FFDD7D 0%, #FFBA2F 100%)',
    marginBottom: '16px',
    boxShadow: '0px 19.3841px 51.6908px rgba(0, 0, 0, 0.09)',
    borderRadius: '15px',
    border: '1px solid #E1E2E2',
    color: 'white'
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default function OutlinedCard(props) {
    const classes = useStyles();
    return (
        <Box sx={{ minWidth: 275 }}>
          <Card className={classes.cardWrapper}>
            <CardContent>
              <Typography variant="h6" gutterBottom className={classes.cardTitle}>
                {props.title}
              </Typography>
            </CardContent>
            <CardActions>
              {props.children}
            </CardActions>
          </Card>
        </Box>
    );
}
