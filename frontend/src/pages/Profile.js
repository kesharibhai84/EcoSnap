import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
  Button,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/axiosConfig'; // Use the configured axios instance

const Profile = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const storedUserData = localStorage.getItem('user');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // First set data from localStorage for immediate display
      if (storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);
          setFormData({
            firstName: parsedUser.firstName || '',
            lastName: parsedUser.lastName || '',
            email: parsedUser.email || ''
          });
          setLoading(false);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // Then try to fetch fresh data from API
      try {
        const response = await api.get('/api/auth/profile');
        console.log('Profile API response:', response.data);
        
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setFormData({
            firstName: response.data.user.firstName || '',
            lastName: response.data.user.lastName || '',
            email: response.data.user.email || ''
          });
          
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        // Only show error if we couldn't load from localStorage either
        if (!storedUserData) {
          setError('Failed to load profile. Please try again.');
        }
        
        // If unauthorized, redirect to login
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [navigate]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle save profile
  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError('');
    setUpdateSuccess(false);
    
    try {
      const response = await api.put('/api/auth/profile', formData);
      
      setUser(response.data.user);
      setEditMode(false);
      setUpdateSuccess(true);
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Dispatch auth change event to update navbar
      window.dispatchEvent(new Event('auth-change'));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // If we don't have user data even after loading
  if (!loading && !user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">
          Could not load profile. Please try logging in again.
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/login')}
        >
          Go to Login
        </Button>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 700,
          mb: 4,
          textAlign: 'center',
          color: 'primary.main'
        }}
      >
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {updateSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}
      
      <Card 
        elevation={6}
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          mb: 4,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto',
                  bgcolor: 'primary.main',
                  fontSize: 48,
                  mb: 2,
                  boxShadow: darkMode 
                    ? '0 8px 16px rgba(0,0,0,0.3)' 
                    : '0 8px 16px rgba(0,0,0,0.1)'
                }}
              >
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Avatar>
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {!editMode ? (
                  `${user?.firstName || ''} ${user?.lastName || ''}`
                ) : (
                  'Edit Profile'
                )}
              </Typography>
              
              {!editMode && user?.createdAt && (
                <Typography variant="body2" color="text.secondary">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              {!editMode ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1">{user?.email || 'N/A'}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      First Name
                    </Typography>
                    <Typography variant="body1">{user?.firstName || 'N/A'}</Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Last Name
                    </Typography>
                    <Typography variant="body1">{user?.lastName || 'N/A'}</Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    required
                    sx={{ mb: 3 }}
                    disabled
                    helperText="Email cannot be changed"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditMode(false);
                        if (user) {
                          setFormData({
                            firstName: user.firstName || '',
                            lastName: user.lastName || '',
                            email: user.email || ''
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile; 