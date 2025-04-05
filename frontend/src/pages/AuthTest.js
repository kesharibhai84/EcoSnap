import React, { useState, useEffect } from 'react';
import { Container, Box, Button, Typography, Card, CardContent, Alert, Divider } from '@mui/material';
import api from '../utils/axiosConfig';

const AuthTest = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [userData, setUserData] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setLoggedIn(true);
      setToken(storedToken);
      setUserData(JSON.parse(storedUser));
    }
  }, []);
  
  const testAuth = async () => {
    try {
      setError('');
      setApiResponse(null);
      
      const response = await api.get('/api/auth/profile');
      setApiResponse(response.data);
    } catch (err) {
      console.error('Auth test error:', err);
      setError(err.response?.data?.message || err.message || 'Error testing authentication');
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
        Authentication Test
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Login Status</Typography>
            <Typography>
              {loggedIn ? '✅ Logged In' : '❌ Not Logged In'}
            </Typography>
          </Box>
          
          {loggedIn && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">User Data</Typography>
                <Box component="pre" sx={{ bgcolor: 'background.paper', p: 2, overflow: 'auto' }}>
                  {JSON.stringify(userData, null, 2)}
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">Token</Typography>
                <Box 
                  component="pre" 
                  sx={{ 
                    bgcolor: 'background.paper', 
                    p: 2, 
                    overflow: 'auto',
                    maxWidth: '100%',
                    wordBreak: 'break-all'
                  }}
                >
                  {token}
                </Box>
              </Box>
            </>
          )}
          
          <Button variant="contained" onClick={testAuth} disabled={!loggedIn}>
            Test Profile API
          </Button>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {apiResponse && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">API Response</Typography>
              <Box component="pre" sx={{ bgcolor: 'background.paper', p: 2, overflow: 'auto' }}>
                {JSON.stringify(apiResponse, null, 2)}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default AuthTest; 