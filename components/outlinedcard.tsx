import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import classnames from 'classnames';

const useStyles = makeStyles({
  boxWrapper: {
    padding: '25px',
  },
  cardWrapper: {
    background: 'linear-gradient(321.69deg, #FFDD7D 0%, #FFBA2F 100%)',
    marginBottom: '16px',
    boxShadow: 'none',
    borderRadius: '15px',
    color: 'white',
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
