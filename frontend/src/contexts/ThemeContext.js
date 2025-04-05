import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Create a theme instance based on current mode
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        // Green shades
        main: darkMode ? '#4caf50' : '#2e7d32',
        light: darkMode ? '#80e27e' : '#60ad5e',
        dark: darkMode ? '#087f23' : '#005005',
        contrastText: '#fff',
      },
      secondary: {
        // Blue-green shades
        main: darkMode ? '#00bcd4' : '#00897b',
        light: darkMode ? '#62efff' : '#4ebaaa',
        dark: darkMode ? '#008ba3' : '#005b4f',
        contrastText: '#fff',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#212121',
        secondary: darkMode ? '#b0bec5' : '#757575',
      },
    },
    typography: {
      fontFamily: "'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.5px',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.25px',
      },
      h3: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode 
              ? '0 8px 24px rgba(0,0,0,0.25)' 
              : '0 8px 24px rgba(0,0,0,0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode 
                ? '0 12px 32px rgba(0,0,0,0.35)' 
                : '0 12px 32px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: darkMode 
                ? '0 4px 12px rgba(76, 175, 80, 0.4)' 
                : '0 4px 12px rgba(46, 125, 50, 0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 