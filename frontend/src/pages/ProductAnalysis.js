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
import api from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';

const ProductAnalysis = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: ''
  });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.name || !formData.price || !formData.imageUrl) {
        throw new Error('Please fill in all required fields');
      }

      const response = await api.post('/api/products/analyze', {
        ...formData,
        price: parseFloat(formData.price)
      });

      console.log('Analysis successful:', response.data);
      navigate('/products'); // Redirect to products page after successful analysis
    } catch (err) {
      console.error('Error analyzing product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to analyze product');
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ textAlign: 'center', mb: 4 }}
      >
        Analyze Product
      </Typography>

      <Card elevation={3}>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                inputProps: { min: 0, step: "0.01" }
              }}
            />

            <TextField
              fullWidth
              label="Image URL"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              required
              margin="normal"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Analyze Product'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {!analysis && (
        <Box sx={{ mt: 4 }}>
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
        </Box>
      )}

      {analysis && (
        <Grid container spacing={3} sx={{ mt: 4 }}>
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