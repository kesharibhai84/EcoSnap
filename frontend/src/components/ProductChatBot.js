import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';

const ProductChatBot = ({ product }) => {
  console.log('Product in chatbot:', product); // Add this to debug the product object
  
  // Check if product has _id property
  useEffect(() => {
    if (!product || !product._id) {
      console.error('Product object is missing _id property:', product);
    }
  }, [product]);

  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: `Hi there! I can answer questions about "${product.name}". Ask me about ingredients, eco score, or anything else about this product.` 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);

    // Add user message to chat
    setMessages(prevMessages => [
      ...prevMessages,
      { type: 'user', text: userMessage }
    ]);

    try {
      // Send question to backend
      const response = await axios.post(`http://localhost:5000/api/products/${product._id}/chat`, {
        question: userMessage
      });
      
      console.log('Chatbot response:', response.data); // Add this for debugging
      
      // Add bot response to chat
      setMessages(prevMessages => [
        ...prevMessages,
        { type: 'bot', text: response.data.answer }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prevMessages => [
        ...prevMessages,
        { 
          type: 'error', 
          text: 'Sorry, I had trouble processing your question. Please try again.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  const quickQuestions = [
    "Is this product vegan?",
    "Why is this rated this eco score?",
    "Is the packaging recyclable?",
    "What are the environmental impacts?"
  ];

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        height: 450, 
        display: 'flex', 
        flexDirection: 'column'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2, 
        pb: 1, 
        borderBottom: '1px solid #eee' 
      }}>
        <ChatIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Product Assistant</Typography>
      </Box>
      
      {/* Message area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          mb: 2,
          p: 1
        }}
      >
        {messages.map((message, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              mb: 1.5
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 
                  message.type === 'user' ? '#1976d2' : 
                  message.type === 'error' ? '#ffebee' : 
                  '#f5f5f5',
                color: message.type === 'user' ? 'white' : 
                       message.type === 'error' ? '#d32f2f' : 
                       'inherit'
              }}
            >
              <Typography variant="body1">{message.text}</Typography>
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
              <CircularProgress size={20} thickness={4} />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Quick questions */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Suggested questions:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {quickQuestions.map((question, index) => (
            <Chip
              key={index}
              label={question}
              onClick={() => handleQuickQuestion(question)}
              variant="outlined"
              clickable
              size="small"
            />
          ))}
        </Box>
      </Box>
      
      {/* Input area */}
      <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          placeholder="Ask a question about this product..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          variant="outlined"
          size="small"
          disabled={loading}
          sx={{ mr: 1 }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          onClick={handleSendMessage}
          endIcon={<SendIcon />}
          disabled={loading || !inputValue.trim()}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ProductChatBot; 