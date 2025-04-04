# EcoSnap

EcoSnap is a web application that helps users make eco-friendly product choices by analyzing product images, finding similar products, and calculating carbon footprints.

## Features

- **Product Analysis**: Upload product images to analyze ingredients and packaging materials using Google's Gemini API.
- **Similar Products**: Find eco-friendly alternatives to your current products.
- **Carbon Footprint**: Calculate and compare the environmental impact of products.
- **Product Search**: Search through analyzed products to find eco-friendly options.

## Tech Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **AI**: Google Gemini API
- **Deployment**: Cloudflare

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account
- Google Gemini API key
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/kesharibhai84/EcoSnap.git
   cd EcoSnap
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
   PORT=5000
   ```

5. Start the application:
   ```
   cd ..
   ./start.sh
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
EcoSnap/
├── backend/                # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── config/        # Configuration files
│   │   ├── middleware/    # Express middleware
│   │   └── server.js      # Entry point
│   ├── .env               # Environment variables
│   └── package.json       # Backend dependencies
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main component
│   └── package.json       # Frontend dependencies
├── .gitignore             # Git ignore file
├── README.md              # Project documentation
└── start.sh               # Script to start both servers
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for image analysis
- MongoDB Atlas for database hosting
- Cloudflare for deployment and hosting 