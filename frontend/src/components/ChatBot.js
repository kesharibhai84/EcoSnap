import React, { useState } from 'react';
import axios from 'axios';

const ChatBot = ({ productId }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const question = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to chat immediately
    setChatHistory(prev => [...prev, { 
      type: 'user', 
      content: question 
    }]);

    try {
      const response = await axios.post(`/api/products/${productId}/chat`, {
        question
      });

      // Add bot response to chat
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        content: response.data.answer 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        type: 'error', 
        content: 'Sorry, I had trouble processing your question. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setMessage(question);
  };

  const quickQuestions = [
    "Is this product vegan?",
    "Why is this rated this eco score?",
    "Is the packaging recyclable?",
    "What's the environmental impact?"
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Ask about this product</h3>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(q)}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 overflow-y-auto mb-4 p-2">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 ${
              msg.type === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg max-w-[80%] ${
                msg.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.type === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center">
            <div className="inline-block p-3">
              <div className="dot-typing"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question about this product..."
          className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBot; 