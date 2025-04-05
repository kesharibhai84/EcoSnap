// ProductAnalysis.jsx
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
  CardActionArea,
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
      const base64Image = await convertImageToBase64(image);
      const response = await axios.post('http://localhost:5000/api/products/analyze', {
        imageUrl: base64Image,
        price: parseFloat(price)
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
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 8 }}
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
        <Box>
          <Grid container spacing={3}>
            {/* Product Details */}
            <Grid item xs={12} md={7}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {analysis.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <img
                      src={analysis.imageUrl}
                      alt={analysis.name}
                      style={{ width: '200px', height: 'auto', borderRadius: 8 }}
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
                        <ul style={{ paddingLeft: '20px' }}>
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
                  <ul style={{ paddingLeft: '20px' }}>
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
              {/* Similar Products */}
              {analysis.similarProducts && analysis.similarProducts.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Similar Products
                  </Typography>
                  <Grid container spacing={2}>
                    {analysis.similarProducts.map((product) => (
                      <Grid item xs={12} sm={6} md={4} key={product.link}>
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Card>
                            <CardActionArea>
                              {product.imageUrl ? (
                                <Box sx={{ height: 140, overflow: 'hidden' }}>
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    height: 140,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.200'
                                  }}
                                >
                                  <Typography variant="caption">No Image</Typography>
                                </Box>
                              )}
                              <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                  {product.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ${product.price}
                                </Typography>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </a>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>
            {/* Chatbot Column */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ask About This Product
                  </Typography>
                  <SimpleChatBot product={analysis} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ProductAnalysis;
