const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 