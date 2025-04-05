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
  CardContent
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with email:', email);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      console.log('Login successful:', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Dispatch custom event to notify components about login
      window.dispatchEvent(new Event('auth-change'));
      
      navigate('/');
    } catch (err) {
      console.error('Login error details:', err);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response) {
        console.log('Error response status:', err.response.status);
        console.log('Error response data:', err.response.data);
        
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
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
            Welcome Back
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              type="email"
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              required
              sx={{ mb: 3 }}
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/signup" 
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login; 