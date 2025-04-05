import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';

const SimpleChatBot = ({ product }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Sending question to:', `http://localhost:5000/api/products/${product._id}/chat`);
      console.log('Product ID:', product._id);
      console.log('Question:', question);
      
      const response = await axios.post(`http://localhost:5000/api/products/${product._id}/chat`, {
        question: question.trim()
      });
      
      console.log('Response:', response.data);
      setAnswer(response.data.answer);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ask about {product.name}
      </Typography>
      
      <TextField
        fullWidth
        label="Your question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        margin="normal"
        variant="outlined"
      />
      
      <Button 
        variant="contained"
        onClick={handleAsk}
        disabled={loading || !question.trim()}
        sx={{ mt: 2, mb: 3 }}
        fullWidth
      >
        {loading ? 'Asking...' : 'Ask Question'}
      </Button>
      
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {answer && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body1">{answer}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SimpleChatBot; 