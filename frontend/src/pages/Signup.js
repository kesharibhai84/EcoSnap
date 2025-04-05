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
  StepLabel
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const Signup = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
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
      console.log('Attempting to sign up with:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
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
      
      console.log('Signup successful:', response.data);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Dispatch custom event
      window.dispatchEvent(new Event('auth-change'));
      
      // Redirect to home
      navigate('/');
    } catch (err) {
      console.error('Registration error details:', err);
      
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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card 
        elevation={6}
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: 'primary.main',
              mb: 3
            }}
          >
            Create Account
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<PersonAddIcon />}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                endIcon={<NavigateNextIcon />}
              >
                Next
              </Button>
            )}
          </Box>
          
          {activeStep === 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/login" 
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Signup; 