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
  const isDarkMode = theme.palette.mode === 'dark';

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
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
      {/* 3D Background Scene */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0,
        background: 'linear-gradient(to bottom, #000000, #0a0a0a)'
      }}>
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
                    background: 'linear-gradient(45deg, #ffffff, #4CAF50)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.5px',
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
                    color: '#e0e0e0',
                    fontWeight: 300,
                    letterSpacing: '0.5px',
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
                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                    color: 'white',
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    borderRadius: '30px',
                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                      transform: 'scale(1.05)',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
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
            background: isDarkMode ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255, 255, 255, 0.95)',
            py: 8,
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h2"
              align="center"
              gutterBottom
              sx={{
                color: '#4CAF50',
                fontWeight: 'bold',
                mb: 4,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '1px',
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
                      transition: 'all 0.3s ease-in-out',
                      background: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        transform: 'translateY(-10px) scale(1.02)',
                        boxShadow: '0 10px 30px rgba(76, 175, 80, 0.2)',
                        background: isDarkMode ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 1)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2,
                          color: '#4CAF50',
                          '& svg': {
                            fontSize: '3rem',
                            transition: 'transform 0.3s ease-in-out',
                          },
                          '&:hover svg': {
                            transform: 'scale(1.2) rotate(10deg)',
                            color: '#45a049',
                          },
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        align="center"
                        gutterBottom
                        sx={{ 
                          fontWeight: 'bold',
                          color: isDarkMode ? '#ffffff' : '#333333',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography 
                        align="center" 
                        sx={{
                          color: isDarkMode ? '#b0b0b0' : '#666666',
                          lineHeight: 1.6,
                          letterSpacing: '0.3px',
                        }}
                      >
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