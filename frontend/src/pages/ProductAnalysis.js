import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SimpleChatBot from '../components/SimpleChatBot';
import axios from 'axios';

const ProductAnalysis = () => {
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!image || !price) {
      setError('Please provide both an image and price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(image);

      // Send to backend
      const response = await axios.post('http://localhost:5000/api/products/analyze', {
        imageUrl: base64Image,
        price: parseFloat(price),
      });

      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const convertImageToBase64 = (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Product Analysis
      </Typography>

      {!analysis ? (
        // Upload and analysis form
        <Box sx={{ mb: 4 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleImageUpload}
          />
          <label htmlFor="image-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload Product Image
            </Button>
          </label>

          {image && (
            <Box sx={{ mt: 2 }}>
              <img
                src={image}
                alt="Product"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </Box>
          )}

          <TextField
            fullWidth
            label="Product Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !image || !price}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze Product'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      ) : (
        // Product analysis result and chatbot
        <Grid container spacing={3}>
          {/* Product details column */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {analysis.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <img
                    src={analysis.imageUrl}
                    alt={analysis.name}
                    style={{ width: '200px', height: 'auto' }}
                  />
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Price:</strong> ${analysis.price}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Eco Score:</strong> {analysis.carbonFootprint.score}/100
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Environmental Impact:
                      </Typography>
                      <ul>
                        <li>Manufacturing: {analysis.carbonFootprint.details.manufacturing}/100</li>
                        <li>Transportation: {analysis.carbonFootprint.details.transportation}/100</li>
                        <li>Packaging: {analysis.carbonFootprint.details.packaging}/100</li>
                        <li>Lifecycle: {analysis.carbonFootprint.details.lifecycle}/100</li>
                      </ul>
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Ingredients
                </Typography>
                <ul>
                  {analysis.ingredients.map((ingredient, idx) => (
                    <li key={idx}>{ingredient}</li>
                  ))}
                </ul>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Packaging
                </Typography>
                <Typography>
                  <strong>Materials:</strong> {analysis.packagingDetails.materials.join(', ')}
                </Typography>
                <Typography>
                  <strong>Recyclable:</strong> {analysis.packagingDetails.recyclable ? 'Yes' : 'No'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Chatbot column */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>
              Ask About This Product
            </Typography>
            <SimpleChatBot product={analysis} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ProductAnalysis; 