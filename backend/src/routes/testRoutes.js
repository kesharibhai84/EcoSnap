const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

router.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date() });
});

// Test endpoint to check the hashed password in the database
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user without checking password
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        exists: false
      });
    }
    
    // Return success with user info (excluding actual password)
    res.json({
      message: 'User exists',
      exists: true,
      passwordHash: user.password.substring(0, 10) + '...' // Show just beginning of hash for debugging
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint for login with console logs
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('User found, comparing passwords');
    console.log('Stored hash:', user.password);
    
    // Compare passwords using direct bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('Login successful');
    
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login test error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Add this route to test password comparison directly
router.post('/test-password', async (req, res) => {
  try {
    const { plainPassword, hashedPassword } = req.body;
    
    if (!plainPassword || !hashedPassword) {
      return res.status(400).json({ message: 'Both plainPassword and hashedPassword are required' });
    }
    
    console.log('Testing password match:');
    console.log('Plain password:', plainPassword);
    console.log('Hashed password:', hashedPassword);
    
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    
    console.log('Password match result:', isMatch);
    
    res.json({
      isMatch,
      message: isMatch ? 'Passwords match' : 'Passwords do not match'
    });
  } catch (error) {
    console.error('Password test error:', error);
    res.status(500).json({ message: 'Password test failed', error: error.message });
  }
});

// Add a route to get all users (for DEVELOPMENT only - remove in production)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      message: `Found ${users.length} users`,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users', error: error.message });
  }
});

// Add a route to debug password for a specific user
router.post('/debug-password', async (req, res) => {
  try {
    const { email, testPassword } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    res.json({
      message: isMatch ? 'Password matches' : 'Password does not match',
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        id: user._id
      },
      passwordHashPrefix: user.password.substring(0, 10) + '...',
      isMatch
    });
  } catch (error) {
    console.error('Debug password error:', error);
    res.status(500).json({ message: 'Password debug failed', error: error.message });
  }
});

module.exports = router; 