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
  useTheme
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import LoginScene from '../components/3D/LoginScene';
import '../styles/animations.css';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
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
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      window.dispatchEvent(new Event('auth-change'));
      
      navigate('/');
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
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
        <LoginScene />
      </Box>

      {/* Content Container */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
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
                Welcome Back
              </Typography>
              
              {error && (
                <Alert severity="error" className="scale-in-delay-2" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  type="email"
                  required
                  className="slide-in-delay-2"
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
                  className="slide-in-delay-3"
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
                  disabled={loading}
                  startIcon={<LoginIcon />}
                  className="scale-in-delay-3"
                  sx={{
                    py: 1.5,
                    mb: 2,
                    background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                    },
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }} className="float-in-delay-3">
                  <Typography variant="body2" sx={{ color: darkMode ? '#b0b0b0' : '#666666' }}>
                    Don't have an account?{' '}
                    <Link 
                      component={RouterLink} 
                      to="/signup" 
                      sx={{ 
                        color: '#4CAF50',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Sign Up
                    </Link>
                  </Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default Login; 