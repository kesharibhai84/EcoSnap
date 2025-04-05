const axios = require('axios');

const verifyTurnstile = async (req, res, next) => {
  const { turnstileToken } = req.body;
  
  if (!turnstileToken) {
    return res.status(400).json({ error: 'Turnstile token is required' });
  }
  
  try {
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
        response: turnstileToken
      }
    );
    
    if (!response.data.success) {
      return res.status(400).json({ error: 'Invalid Turnstile token' });
    }
    
    next();
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({ error: 'Error verifying Turnstile token' });
  }
};

module.exports = verifyTurnstile; 