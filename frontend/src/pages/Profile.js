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
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextareaAutosize
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import NatureIcon from '@mui/icons-material/Nature';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/axiosConfig'; // Use the configured axios instance
import '../styles/animations.css';

const Profile = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    profilePicture: null,
    environmentalPreferences: {
      recycling: true,
      composting: false,
      vegan: false,
      vegetarian: false,
      sustainableTransport: true,
      energyConservation: true
    },
    notificationPreferences: {
      email: true,
      push: true,
      newsletter: true
    }
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
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            address: parsedUser.address || '',
            bio: parsedUser.bio || '',
            facebook: parsedUser.facebook || '',
            twitter: parsedUser.twitter || '',
            instagram: parsedUser.instagram || '',
            linkedin: parsedUser.linkedin || '',
            profilePicture: parsedUser.profilePicture || null,
            environmentalPreferences: parsedUser.environmentalPreferences || {
              recycling: true,
              composting: false,
              vegan: false,
              vegetarian: false,
              sustainableTransport: true,
              energyConservation: true
            },
            notificationPreferences: parsedUser.notificationPreferences || {
              email: true,
              push: true,
              newsletter: true
            }
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
            email: response.data.user.email || '',
            phone: response.data.user.phone || '',
            address: response.data.user.address || '',
            bio: response.data.user.bio || '',
            facebook: response.data.user.facebook || '',
            twitter: response.data.user.twitter || '',
            instagram: response.data.user.instagram || '',
            linkedin: response.data.user.linkedin || '',
            profilePicture: response.data.user.profilePicture || null,
            environmentalPreferences: response.data.user.environmentalPreferences || {
              recycling: true,
              composting: false,
              vegan: false,
              vegetarian: false,
              sustainableTransport: true,
              energyConservation: true
            },
            notificationPreferences: response.data.user.notificationPreferences || {
              email: true,
              push: true,
              newsletter: true
            }
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
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (!loading && !user) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
          : 'linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%)',
        py: 8
      }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Card 
            elevation={6}
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                Could not load profile. Please try logging in again.
              </Alert>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 2,
                  background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                  }
                }}
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }
  
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
          : 'linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%)'
      }}>
        <CircularProgress size={60} sx={{ color: '#4CAF50' }} />
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: darkMode 
        ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
        : 'linear-gradient(135deg, #f5f5f5 0%, #e8f5e9 100%)',
      py: 8
    }}>
      <Container maxWidth="md">
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            mb: 4,
            textAlign: 'center',
            color: '#4CAF50',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
          className="slide-in-delay-1"
        >
          My Profile
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} className="scale-in-delay-2">
            {error}
          </Alert>
        )}
        
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 3 }} className="scale-in-delay-2">
            Profile updated successfully!
          </Alert>
        )}
        
        <Card 
          elevation={6}
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            mb: 4,
            background: darkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)'
            }
          }}
          className="float-in-delay-2"
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar 
                    src={formData.profilePicture}
                    sx={{ 
                      width: 150, 
                      height: 150, 
                      mx: 'auto',
                      bgcolor: 'primary.main',
                      fontSize: 60,
                      mb: 2,
                      boxShadow: darkMode 
                        ? '0 8px 16px rgba(0,0,0,0.3)' 
                        : '0 8px 16px rgba(0,0,0,0.1)',
                      border: '4px solid #4CAF50'
                    }}
                  >
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </Avatar>
                  {!editMode && (
                    <Tooltip title="Edit Profile">
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: '#4CAF50',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#45a049'
                          }
                        }}
                        onClick={() => setEditMode(true)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  {!editMode ? (
                    `${user?.firstName || ''} ${user?.lastName || ''}`
                  ) : (
                    'Edit Profile'
                  )}
                </Typography>
                
                {!editMode && user?.createdAt && (
                  <Chip
                    icon={<CalendarTodayIcon />}
                    label={`Joined ${new Date(user.createdAt).toLocaleDateString()}`}
                    sx={{ 
                      mt: 1,
                      bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                      color: '#4CAF50'
                    }}
                  />
                )}
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  sx={{ 
                    mb: 3,
                    '& .MuiTab-root': {
                      color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      '&.Mui-selected': {
                        color: '#4CAF50'
                      }
                    }
                  }}
                >
                  <Tab label="Personal Info" />
                  <Tab label="Environmental" />
                  <Tab label="Social" />
                </Tabs>

                {!editMode ? (
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'
                  }}>
                    {activeTab === 0 && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <PersonIcon sx={{ mr: 2, color: '#4CAF50' }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Full Name
                            </Typography>
                            <Typography variant="body1">
                              {user?.firstName} {user?.lastName}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <EmailIcon sx={{ mr: 2, color: '#4CAF50' }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body1">
                              {user?.email}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <PhoneIcon sx={{ mr: 2, color: '#4CAF50' }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body1">
                              {user?.phone || 'Not provided'}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <LocationOnIcon sx={{ mr: 2, color: '#4CAF50' }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Address
                            </Typography>
                            <Typography variant="body1">
                              {user?.address || 'Not provided'}
                            </Typography>
                          </Box>
                        </Box>

                        {user?.bio && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                About Me
                              </Typography>
                              <Typography variant="body1">
                                {user.bio}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </>
                    )}

                    {activeTab === 1 && (
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#4CAF50' }}>
                          Environmental Preferences
                        </Typography>
                        <Grid container spacing={2}>
                          {Object.entries(user?.environmentalPreferences || {}).map(([key, value]) => (
                            <Grid item xs={12} sm={6} key={key}>
                              <Chip
                                icon={<NatureIcon />}
                                label={key.replace(/([A-Z])/g, ' $1').trim()}
                                color={value ? "success" : "default"}
                                sx={{ m: 0.5 }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {activeTab === 2 && (
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#4CAF50' }}>
                          Social Media
                        </Typography>
                        <Grid container spacing={2}>
                          {user?.facebook && (
                            <Grid item>
                              <IconButton href={user.facebook} target="_blank">
                                <FacebookIcon sx={{ color: '#4CAF50' }} />
                              </IconButton>
                            </Grid>
                          )}
                          {user?.twitter && (
                            <Grid item>
                              <IconButton href={user.twitter} target="_blank">
                                <TwitterIcon sx={{ color: '#4CAF50' }} />
                              </IconButton>
                            </Grid>
                          )}
                          {user?.instagram && (
                            <Grid item>
                              <IconButton href={user.instagram} target="_blank">
                                <InstagramIcon sx={{ color: '#4CAF50' }} />
                              </IconButton>
                            </Grid>
                          )}
                          {user?.linkedin && (
                            <Grid item>
                              <IconButton href={user.linkedin} target="_blank">
                                <LinkedInIcon sx={{ color: '#4CAF50' }} />
                              </IconButton>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                      <>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-picture-upload"
                          type="file"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="profile-picture-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            sx={{ mb: 3 }}
                          >
                            Upload Profile Picture
                          </Button>
                        </label>

                        <TextField
                          fullWidth
                          label="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <PersonIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />
                        
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <PersonIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />
                        
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <EmailIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <PhoneIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <LocationOnIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />

                        <TextField
                          fullWidth
                          label="Bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          multiline
                          rows={4}
                          sx={{ mb: 3 }}
                        />
                      </>
                    )}

                    {activeTab === 1 && (
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#4CAF50' }}>
                          Environmental Preferences
                        </Typography>
                        <Grid container spacing={2}>
                          {Object.entries(formData.environmentalPreferences).map(([key, value]) => (
                            <Grid item xs={12} sm={6} key={key}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={value}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        environmentalPreferences: {
                                          ...prev.environmentalPreferences,
                                          [key]: e.target.checked
                                        }
                                      }));
                                    }}
                                    color="success"
                                  />
                                }
                                label={key.replace(/([A-Z])/g, ' $1').trim()}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {activeTab === 2 && (
                      <Box>
                        <Typography variant="h6" gutterBottom sx={{ color: '#4CAF50' }}>
                          Social Media Links
                        </Typography>
                        <TextField
                          fullWidth
                          label="Facebook"
                          name="facebook"
                          value={formData.facebook}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <FacebookIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Twitter"
                          name="twitter"
                          value={formData.twitter}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <TwitterIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Instagram"
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <InstagramIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />
                        <TextField
                          fullWidth
                          label="LinkedIn"
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleChange}
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <LinkedInIcon sx={{ mr: 1, color: '#4CAF50' }} />
                            )
                          }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => setEditMode(false)}
                        sx={{
                          color: '#4CAF50',
                          borderColor: '#4CAF50',
                          '&:hover': {
                            borderColor: '#45a049',
                            bgcolor: 'rgba(76, 175, 80, 0.1)'
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                        sx={{
                          background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #45a049, #4CAF50)',
                          }
                        }}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Profile; 