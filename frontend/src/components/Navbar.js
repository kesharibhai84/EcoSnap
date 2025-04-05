import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme as useMuiTheme,
  Container,
  Slide,
  Tooltip,
  Divider,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import FlareIcon from '@mui/icons-material/Flare';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '../contexts/ThemeContext';

// Logo component with 3D effect
const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& .logo-icon': {
    marginRight: theme.spacing(1),
    animation: 'float 3s ease-in-out infinite',
  },
  '& .logo-text': {
    fontWeight: 700,
    letterSpacing: '0.5px',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(90deg, #4caf50, #81c784)'
      : 'linear-gradient(90deg, #2e7d32, #4caf50)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: theme.palette.mode === 'dark'
      ? '0px 2px 4px rgba(0,0,0,0.5)'
      : '0px 2px 4px rgba(0,0,0,0.1)',
  },
}));

// Custom styled button
const NavButton = styled(Button)(({ theme, active }) => ({
  margin: theme.spacing(0, 0.5),
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(1, 2),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  fontWeight: active ? 600 : 500,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: active ? '100%' : '0%',
    height: '3px',
    backgroundColor: theme.palette.primary.main,
    transition: 'width 0.3s ease',
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(76, 175, 80, 0.08)' 
      : 'rgba(46, 125, 50, 0.08)',
    '&::after': {
      width: '100%',
    },
  },
}));

// Mode toggle button with animation
const ModeToggle = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(0, 0, 0, 0.04)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.12)' 
      : 'rgba(0, 0, 0, 0.08)',
  },
  transition: 'all 0.3s ease',
  animation: 'pulse 2s infinite',
}));

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const { darkMode, toggleDarkMode } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  // Check if user is logged in
  useEffect(() => {
    const checkLoginStatus = () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (userData && token) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    
    // Check on initial load
    checkLoginStatus();
    
    // Set up event listener for storage changes
    window.addEventListener('storage', checkLoginStatus);
    
    // Create a custom event for login/logout
    const authListener = () => checkLoginStatus();
    window.addEventListener('auth-change', authListener);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('auth-change', authListener);
    };
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    
    // Dispatch event for other components
    window.dispatchEvent(new Event('auth-change'));
    
    navigate('/');
  };
  
  const mainNavItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Analyze', icon: <SearchIcon />, path: '/analyze' },
    { text: 'Products', icon: <ViewListIcon />, path: '/products' },
  ];
  
  const authNavItems = isLoggedIn 
    ? [
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
        { text: 'Logout', icon: <LogoutIcon />, onClick: handleLogout },
      ]
    : [
        { text: 'Login', icon: <LoginIcon />, path: '/login' },
        { text: 'Sign Up', icon: <PersonAddIcon />, path: '/signup' },
      ];
  
  const isActive = (path) => location.pathname === path;
  
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };
  
  return (
    <Slide appear={false} direction="down" in={true}>
      <AppBar 
        position="sticky" 
        color="inherit" 
        elevation={0}
        sx={{ 
          backdropFilter: 'blur(8px)',
          backgroundColor: darkMode 
            ? 'rgba(30, 30, 30, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Logo */}
            <RouterLink to="/" style={{ textDecoration: 'none', display: 'flex' }}>
              <Logo>
                <FlareIcon 
                  color="primary" 
                  className="logo-icon" 
                  sx={{ fontSize: 28 }} 
                />
                <Typography variant="h5" className="logo-text">
                  EcoSnap
                </Typography>
              </Logo>
            </RouterLink>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Main nav items */}
                {mainNavItems.map((item) => (
                  <NavButton
                    key={item.text}
                    component={RouterLink}
                    to={item.path}
                    active={isActive(item.path) ? 1 : 0}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </NavButton>
                ))}
                
                <Box sx={{ width: 16 }} /> {/* Spacer */}
                
                {/* Auth nav items */}
                {authNavItems.map((item) => (
                  <NavButton
                    key={item.text}
                    component={item.path ? RouterLink : 'button'}
                    to={item.path}
                    onClick={item.onClick}
                    active={item.path && isActive(item.path) ? 1 : 0}
                    startIcon={item.icon}
                    color={item.text === 'Sign Up' ? 'primary' : undefined}
                    variant={item.text === 'Sign Up' ? 'contained' : 'text'}
                    sx={{
                      ml: 1,
                      ...(item.text === 'Sign Up' && {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      })
                    }}
                  >
                    {item.text}
                  </NavButton>
                ))}
                
                <Box sx={{ width: 16 }} /> {/* Spacer */}
                
                {/* User avatar if logged in */}
                {isLoggedIn && user && (
                  <Tooltip title="Profile">
                    <Avatar 
                      sx={{ 
                        ml: 1,
                        bgcolor: 'primary.main',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 0 0 2px #4caf50'
                        }
                      }}
                      onClick={() => navigate('/profile')}
                    >
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                  </Tooltip>
                )}
                
                <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                  <ModeToggle onClick={toggleDarkMode} size="small" sx={{ ml: 1 }}>
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </ModeToggle>
                </Tooltip>
              </Box>
            )}
            
            {/* Mobile Menu Button */}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                  <ModeToggle 
                    onClick={toggleDarkMode} 
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </ModeToggle>
                </Tooltip>
                
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer(true)}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
        
        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: {
              width: 280,
              backgroundColor: muiTheme.palette.background.paper,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
            },
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Menu
            </Typography>
            <IconButton onClick={toggleDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Main Navigation Items */}
          <List sx={{ p: 2 }}>
            {mainNavItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={RouterLink}
                to={item.path}
                onClick={toggleDrawer(false)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  backgroundColor: isActive(item.path)
                    ? (darkMode ? 'rgba(76, 175, 80, 0.15)' : 'rgba(46, 125, 50, 0.08)')
                    : 'transparent',
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? muiTheme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ mx: 2 }} />
          
          {/* Auth Navigation Items */}
          <List sx={{ p: 2 }}>
            {authNavItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={item.path ? RouterLink : 'div'}
                to={item.path}
                onClick={(e) => {
                  if (item.onClick) item.onClick(e);
                  toggleDrawer(false)(e);
                }}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  backgroundColor: (item.path && isActive(item.path))
                    ? (darkMode ? 'rgba(76, 175, 80, 0.15)' : 'rgba(46, 125, 50, 0.08)')
                    : 'transparent',
                }}
              >
                <ListItemIcon sx={{ color: (item.path && isActive(item.path)) ? muiTheme.palette.primary.main : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: (item.path && isActive(item.path)) ? 600 : 400,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>
      </AppBar>
    </Slide>
  );
};

export default Navbar; 