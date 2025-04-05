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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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

      {analysis && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Product Details
                </Typography>
                <Typography>Name: {analysis.name}</Typography>
                <Typography>Price: ${analysis.price}</Typography>
                <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                  Ingredients
                </Typography>
                <ul>
                  {analysis.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environmental Impact
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  Score: {analysis.carbonFootprint.score}/100
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                  Details
                </Typography>
                <Typography>Manufacturing: {analysis.carbonFootprint.details.manufacturing}</Typography>
                <Typography>Transportation: {analysis.carbonFootprint.details.transportation}</Typography>
                <Typography>Packaging: {analysis.carbonFootprint.details.packaging}</Typography>
                <Typography>Lifecycle: {analysis.carbonFootprint.details.lifecycle}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Similar Products
                </Typography>
                <Grid container spacing={2}>
                  {analysis.similarProducts.map((product, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ width: '100%', height: 'auto' }}
                          />
                          <Typography variant="subtitle1">{product.name}</Typography>
                          <Typography>Price: ${product.price}</Typography>
                          <Typography>Eco Score: {product.carbonFootprint}/100</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ProductAnalysis; 