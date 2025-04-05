const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register new user
const register = async (userData) => {
  // Check if email is already in use
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('Email is already in use');
  }
  
  // Create new user
  const user = new User(userData);
  await user.save();
  
  // Generate token
  const token = generateToken(user._id);
  
  return { user, token };
};

// Login user
const login = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  // Update last login time
  user.lastLogin = Date.now();
  await user.save();
  
  // Generate token
  const token = generateToken(user._id);
  
  return { user, token };
};

// Get user by ID
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

module.exports = {
  register,
  login,
  getUserById,
  generateToken
}; 