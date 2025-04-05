import React, { useState } from 'react';
import axios from 'axios';

const ProductDetails = ({ product }) => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`/api/products/${product._id}/chat`, {
        question: question.trim()
      });

      setChatHistory(prev => [...prev, {
        question: question.trim(),
        answer: response.data.answer,
        timestamp: new Date()
      }]);
      setQuestion('');
    } catch (error) {
      console.error('Error getting answer:', error);
      alert('Failed to get answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Product Info Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
          <div className="mb-4">
            <h3 className="font-semibold">Eco Score</h3>
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${product.carbonFootprint.score}%` }}
                ></div>
              </div>
              <span>{product.carbonFootprint.score}/100</span>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">Ingredients</h3>
            <ul className="list-disc list-inside">
              {product.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Packaging</h3>
            <p>Materials: {product.packagingDetails.materials.join(', ')}</p>
            <p>Recyclable: {product.packagingDetails.recyclable ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Chatbot Section */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-xl font-bold mb-4">Ask about this product</h3>
        
        {/* Chat History */}
        <div className="mb-4 max-h-96 overflow-y-auto">
          {chatHistory.map((chat, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600">Q</span>
                </div>
                <div className="flex-1">
                  <p className="bg-blue-50 p-3 rounded-lg inline-block">
                    {chat.question}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600">A</span>
                </div>
                <div className="flex-1">
                  <p className="bg-green-50 p-3 rounded-lg inline-block">
                    {chat.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Question Input */}
        <form onSubmit={handleQuestionSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about ingredients, eco score, packaging..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Asking...' : 'Ask'}
          </button>
        </form>

        {/* Example Questions */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">Example questions:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {[
              "Is this product vegan?",
              "Why is this eco score low/high?",
              "Is the packaging recyclable?",
              "What's the environmental impact?"
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => setQuestion(q)}
                className="text-sm px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 