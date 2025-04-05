import React from 'react';
import ChatBot from './ChatBot';

const ProductDetail = ({ product }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Product Image */}
        <div>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
          
          {/* Eco Score */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Eco Score</h2>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${product.carbonFootprint.score}%` }}
                ></div>
              </div>
              <span className="font-medium">
                {product.carbonFootprint.score}/100
              </span>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Ingredients</h2>
            <ul className="list-disc list-inside">
              {product.ingredients.map((ingredient, index) => (
                <li key={index} className="mb-1">{ingredient}</li>
              ))}
            </ul>
          </div>

          {/* Packaging */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Packaging</h2>
            <p>Materials: {product.packagingDetails.materials.join(', ')}</p>
            <p>Recyclable: {product.packagingDetails.recyclable ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <div className="mt-8">
        <ChatBot productId={product._id} />
      </div>
    </div>
  );
};

export default ProductDetail; 