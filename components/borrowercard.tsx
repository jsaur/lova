import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function BorrowerCard(props) {
  return (
    <Card sx={{ maxWidth: 345, boxShadow: 'none', marginTop: '15px' }}>
      <CardMedia
        component="img"
        height="100px"
        image={props.imgsource}
        alt="green iguana"
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {props.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {props.state}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {props.description}
        </Typography>
      </CardContent>
      <CardActions>
        {props.children}
      </CardActions>
    </Card>
  );
}
