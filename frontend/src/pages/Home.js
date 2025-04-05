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
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CompareIcon from '@mui/icons-material/Compare';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ThreeScene from '../components/ThreeScene';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();

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
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* 3D Background Scene */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <ThreeScene />
      </Box>

      {/* Content Container */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.3))',
              zIndex: -1,
            },
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h2"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 1s ease-in',
                  }}
                >
                  Make Eco-Friendly Choices
                </Typography>
                <Typography
                  variant="h5"
                  paragraph
                  sx={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 1s ease-in 0.5s',
                    animationFillMode: 'both',
                  }}
                >
                  Analyze products, compare alternatives, and reduce your environmental impact with EcoSnap.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/analyze')}
                  sx={{
                    mt: 2,
                    animation: 'fadeIn 1s ease-in 1s',
                    animationFillMode: 'both',
                    backgroundColor: '#4CAF50',
                    '&:hover': {
                      backgroundColor: '#45a049',
                      transform: 'scale(1.05)',
                      transition: 'transform 0.3s ease-in-out',
                    },
                  }}
                >
                  Start Analyzing
                </Button>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Box
          sx={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.9)',
            py: 8,
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h2"
              align="center"
              gutterBottom
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 'bold',
                mb: 4,
              }}
            >
              Features
            </Typography>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: theme.shadows[10],
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2,
                          color: theme.palette.primary.main,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        align="center"
                        gutterBottom
                        sx={{ fontWeight: 'bold' }}
                      >
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
      </Box>

      {/* Add global styles for animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default Home; 