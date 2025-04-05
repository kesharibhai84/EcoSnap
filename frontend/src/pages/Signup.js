import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import SignupScene from '../components/3D/SignupScene';
import '../styles/animations.css';

const Signup = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Steps
  const steps = [
    'Personal Info',
    'Account Details',
    'Review'
  ];
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Validate current step
  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formData.firstName !== '' && formData.lastName !== '';
      case 1:
        return (
          formData.email !== '' && 
          formData.password !== '' && 
          formData.password === formData.confirmPassword
        );
      default:
        return true;
    }
  };
  
  // Handle next step
  const handleNext = () => {
    if (isStepValid()) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    } else {
      setError('Please fill in all required fields correctly');
    }
  };
  
  // Handle previous step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!isStepValid()) {
      setError('Please fill in all fields correctly');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios({
        method: 'post',
        url: 'http://localhost:5000/api/auth/signup',
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      navigate('/');
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Get content for current step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '240px' }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '240px' }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4CAF50',
                    },
                  },
                }}
              />
            </Box>
          </Box>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              type={showPassword ? 'text' : 'password'}
              required
              error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
              helperText={
                formData.password !== formData.confirmPassword && formData.confirmPassword !== '' 
                  ? "Passwords do not match" 
                  : ""
              }
            />
          </>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            <Box 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 3, 
                bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' 
              }}
            >
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {formData.email}
              </Typography>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh', 
      overflow: 'hidden', 
      background: darkMode ? '#0a0a0a' : '#f5f5f5',
    }}>
      {/* 3D Background Scene */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0,
        background: darkMode 
          ? 'linear-gradient(to bottom, #000000, #0a0a0a)' 
          : 'linear-gradient(to bottom, #e8f5e9, #f5f5f5)'
      }}>
        <SignupScene />
      </Box>

      {/* Content Container */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Card 
            elevation={6}
            className="float-in"
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              background: darkMode 
                ? 'rgba(30, 30, 30, 0.8)' 
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: darkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.1)',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 30px rgba(76, 175, 80, 0.2)',
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                align="center" 
                gutterBottom
                className="slide-in-delay-1"
                sx={{ 
                  fontWeight: 700,
                  color: '#4CAF50',
                  mb: 3,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                Create Your Account
              </Typography>

              {error && (
                <Alert severity="error" className="scale-in-delay-2" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Stepper activeStep={activeStep} className="slide-in-delay-2" sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mb: 4 }} className="slide-in-delay-3">
                {getStepContent(activeStep)}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }} className="float-in-delay-3">
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<NavigateBeforeIcon />}
                  sx={{
                    color: '#4CAF50',
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    },
                  }}
                >
                  Back
                </Button>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    endIcon={<PersonAddIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                      },
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NavigateNextIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                      },
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }} className="float-in-delay-3">
                <Typography variant="body2" sx={{ color: darkMode ? '#b0b0b0' : '#666666' }}>
                  Already have an account?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/login" 
                    sx={{ 
                      color: '#4CAF50',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default Signup; 