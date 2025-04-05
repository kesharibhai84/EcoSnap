import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import LeafIcon from '@mui/icons-material/Flare';
import SearchIcon from '@mui/icons-material/Search';
import CompareIcon from '@mui/icons-material/Compare';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SearchIcon fontSize="large" />,
      title: 'Product Analysis',
      description: 'Upload product images to analyze ingredients and packaging materials.',
    },
    {
      icon: <CompareIcon fontSize="large" />,
      title: 'Similar Products',
      description: 'Find eco-friendly alternatives to your current products.',
    },
    {
      icon: <TrendingUpIcon fontSize="large" />,
      title: 'Carbon Footprint',
      description: 'Calculate and compare the environmental impact of products.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Make Eco-Friendly Choices
              </Typography>
              <Typography variant="h5" paragraph>
                Analyze products, compare alternatives, and reduce your environmental impact with EcoSnap.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/analyze')}
                sx={{ mt: 2 }}
              >
                Start Analyzing
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <LeafIcon sx={{ fontSize: 200 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h3" align="center" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography align="center" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 