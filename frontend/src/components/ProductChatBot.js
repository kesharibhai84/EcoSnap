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
  Divider,
  IconButton,
  Collapse,
  Zoom
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const ProductChatBot = ({ product }) => {
  console.log('Product in chatbot:', product); // Add this to debug the product object
  
  // Check if product has _id property
  useEffect(() => {
    if (!product || !product._id) {
      console.error('Product object is missing _id property:', product);
    }
  }, [product]);

  const [isOpen, setIsOpen] = useState(false);
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
    <>
      {/* Floating Help Button */}
      <Zoom in={!isOpen}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<HelpOutlineIcon />}
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            }
          }}
        >
          Need Assistance?
        </Button>
      </Zoom>

      {/* Chat Window */}
      <Collapse in={isOpen} timeout={300}>
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 350,
            height: 500,
            borderRadius: 2,
            display: 'flex', 
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2, 
            bgcolor: 'primary.main',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChatIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Product Assistant</Typography>
            </Box>
            <IconButton 
              onClick={() => setIsOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Message area */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              p: 2,
              bgcolor: 'background.default'
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
                    maxWidth: '80%',
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 
                      message.type === 'user' ? 'primary.main' : 
                      message.type === 'error' ? 'error.light' : 
                      'background.paper',
                    color: message.type === 'user' ? 'white' : 
                           message.type === 'error' ? 'error.main' : 
                           'text.primary',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                </Box>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.paper' }}>
                  <CircularProgress size={20} thickness={4} />
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Quick questions */}
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
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
          <Box 
            component="form" 
            onSubmit={handleSendMessage} 
            sx={{ 
              display: 'flex',
              p: 2,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask a question..."
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
              disabled={loading || !inputValue.trim()}
              sx={{ minWidth: 'auto' }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default ProductChatBot; 