const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');
const verifyTurnstile = require('../middleware/verifyTurnstile');

// Login route with Turnstile verification
router.post('/login', verifyTurnstile, login);

// Signup route with Turnstile verification
router.post('/signup', verifyTurnstile, signup);

module.exports = router; 