const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test DB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    console.log('Connection string:', process.env.MONGODB_URI);
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 