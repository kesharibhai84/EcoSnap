import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';
import LeafIcon from '@mui/icons-material/Flare';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <LeafIcon sx={{ mr: 2 }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            EcoSnap
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/analyze"
          >
            Analyze Product
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/products"
          >
            Products
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 