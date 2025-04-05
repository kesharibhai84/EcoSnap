import React, { useState, useEffect, Fragment } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RecyclingIcon from '@mui/icons-material/Recycling';
import Slider from '@mui/material/Slider';

const ProductAnalysis = () => {
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [maxPriceRange, setMaxPriceRange] = useState(5000); // Default max range

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

  useEffect(() => {
    if (analysis && analysis.price) {
      // Set initial range to 20% below and above the product price
      const minPrice = Math.max(0, Math.floor(analysis.price * 0.8));
      const maxPrice = Math.ceil(analysis.price * 1.2);
      setPriceRange([minPrice, maxPrice]);
      
      // Set the max possible range based on product price
      setMaxPriceRange(Math.ceil(analysis.price * 3));
      
      // Initialize filtered products
      filterSimilarProducts([minPrice, maxPrice]);
    }
  }, [analysis]);

  const filterSimilarProducts = (range) => {
    if (!analysis || !analysis.similarProducts) return;
    
    const filtered = analysis.similarProducts.filter(
      product => product.price >= range[0] && product.price <= range[1]
    );
    setFilteredProducts(filtered);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
    filterSimilarProducts(newValue);
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
                <Typography variant="body1">
                  <strong>Manufacturing Impact:</strong> {
                    typeof analysis.carbonFootprint.details.manufacturing === 'object'
                      ? analysis.carbonFootprint.details.manufacturing.score 
                      : analysis.carbonFootprint.details.manufacturing
                  }/100
                  {analysis.carbonFootprint.details.manufacturing.explanation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {analysis.carbonFootprint.details.manufacturing.explanation}
                    </Typography>
                  )}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Transportation Impact:</strong> {
                    typeof analysis.carbonFootprint.details.transportation === 'object'
                      ? analysis.carbonFootprint.details.transportation.score 
                      : analysis.carbonFootprint.details.transportation
                  }/100
                  {analysis.carbonFootprint.details.transportation.explanation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {analysis.carbonFootprint.details.transportation.explanation}
                    </Typography>
                  )}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Packaging Impact:</strong> {
                    typeof analysis.carbonFootprint.details.packaging === 'object'
                      ? analysis.carbonFootprint.details.packaging.score 
                      : analysis.carbonFootprint.details.packaging
                  }/100
                  {analysis.carbonFootprint.details.packaging.explanation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {analysis.carbonFootprint.details.packaging.explanation}
                    </Typography>
                  )}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Lifecycle Impact:</strong> {
                    typeof analysis.carbonFootprint.details.lifecycle === 'object'
                      ? analysis.carbonFootprint.details.lifecycle.score 
                      : analysis.carbonFootprint.details.lifecycle
                  }/100
                  {analysis.carbonFootprint.details.lifecycle.explanation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {analysis.carbonFootprint.details.lifecycle.explanation}
                    </Typography>
                  )}
                </Typography>

                {/* Overall Explanation */}
                {analysis.carbonFootprint.overallExplanation && (
                  <Typography variant="body2" sx={{ mt: 2, bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                    <strong>Analysis:</strong> {analysis.carbonFootprint.overallExplanation}
                  </Typography>
                )}
                </CardContent>
              </Card>
            </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Similar Products
                  </Typography>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    borderBottom: '2px solid #4caf50', 
                    paddingBottom: '8px',
                    marginBottom: '16px'
                  }}>
                    Similar Products
                  </Typography>
                  
                  <Box sx={{ px: 2, pb: 3, pt: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      Price Range: ₹{priceRange[0]} - ₹{priceRange[1]} 
                      <span style={{ color: '#666', marginLeft: '8px' }}>
                        ({filteredProducts.length} products)
                      </span>
                    </Typography>
                    
                    <Slider
                      value={priceRange}
                      onChange={handlePriceRangeChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={maxPriceRange}
                      valueLabelFormat={(value) => `₹${value}`}
                      sx={{ 
                        color: '#4caf50',
                        '& .MuiSlider-valueLabel': {
                          backgroundColor: '#4caf50'
                        }
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => {
                          const narrow = [
                            Math.max(0, Math.floor(analysis.price * 0.9)),
                            Math.ceil(analysis.price * 1.1)
                          ];
                          setPriceRange(narrow);
                          filterSimilarProducts(narrow);
                        }}
                      >
                        Narrow Range
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => {
                          const wide = [0, maxPriceRange];
                          setPriceRange(wide);
                          filterSimilarProducts(wide);
                        }}
                      >
                        Show All
                      </Button>
                    </Box>
                  </Box>
                  
                  {filteredProducts.length > 0 ? (
                    <Grid container spacing={2}>
                      {filteredProducts.map((product, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Card 
                            elevation={2} 
                            sx={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 5px 10px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                            >
                              <Box sx={{ 
                                position: 'relative',
                                paddingTop: '75%', // 4:3 aspect ratio
                                overflow: 'hidden',
                                backgroundColor: '#f5f5f5'
                              }}>
                                <img
                                  src={product.imageUrl || `https://via.placeholder.com/120?text=${encodeURIComponent(product.name.substring(0, 15))}`}
                                      alt={product.name}
                                      style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                        width: '100%',
                                        height: '100%',
                                    objectFit: 'contain'
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = `https://via.placeholder.com/120?text=${encodeURIComponent(product.name.substring(0, 15))}`;
                                      }}
                                  />
                                </Box>
                          </a>
                          
                          <CardContent sx={{ p: 1.5, pt: 1, pb: '8px !important', flexGrow: 1 }}>
                            <Typography 
                              variant="body2" 
                                  sx={{
                                fontWeight: 'medium',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.2',
                                minHeight: '2.4em',
                                fontSize: '0.85rem'
                              }}
                            >
                                  {product.name}
                                </Typography>
                            
                            <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                              ₹{product.price.toLocaleString()}
                            </Typography>
                            
                            {/* Ingredients Accordion */}
                            {product.ingredients && product.ingredients.length > 0 && (
                              <Accordion 
                                sx={{ 
                                  mt: 1, 
                                  boxShadow: 'none',
                                  '&:before': { display: 'none' },
                                  backgroundColor: 'transparent'
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                                  sx={{ 
                                    p: 0, 
                                    minHeight: '32px !important',
                                    '& .MuiAccordionSummary-content': { m: 0 }
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                                    Ingredients
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0, pt: 0.5, pb: 1 }}>
                                  <List dense disablePadding sx={{ ml: 1, mt: 0 }}>
                                    {Array.isArray(product.ingredients) ? 
                                      product.ingredients.slice(0, 3).map((ingredient, idx) => (
                                        <ListItem key={idx} disablePadding disableGutters sx={{ py: 0.25 }}>
                                          <ListItemIcon sx={{ minWidth: 24 }}>
                                            <FiberManualRecordIcon fontSize="small" sx={{ fontSize: '8px' }} />
                                          </ListItemIcon>
                                          <ListItemText 
                                            primary={ingredient} 
                                            primaryTypographyProps={{ 
                                              variant: 'caption', 
                                              sx: { 
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                              } 
                                            }}
                                          />
                                        </ListItem>
                                      )) : 
                                      <Typography variant="caption">No ingredient data</Typography>
                                    }
                                    {Array.isArray(product.ingredients) && product.ingredients.length > 3 && (
                                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                                        +{product.ingredients.length - 3} more
                                      </Typography>
                                    )}
                                  </List>
                                </AccordionDetails>
                              </Accordion>
                            )}
                            
                            {/* Packaging Info (optional) */}
                            {product.packaging && product.packaging.materials && product.packaging.materials.length > 0 && (
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <RecyclingIcon fontSize="small" sx={{ mr: 0.5, fontSize: '14px' }} />
                                  {product.packaging.recyclable ? 'Recyclable' : 'Non-recyclable'}
                                </Typography>
                              </Box>
                            )}
                              </CardContent>
                          
                          <CardActions sx={{ p: 1, pt: 0 }}>
                            <Button 
                              href={product.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small" 
                              variant="outlined" 
                              fullWidth
                            >
                              View Details
                            </Button>
                          </CardActions>
                          </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No products found in this price range.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => {
                        const wider = [
                          Math.max(0, Math.floor(analysis.price * 0.5)),
                          Math.ceil(analysis.price * 2)
                        ];
                        setPriceRange(wider);
                        filterSimilarProducts(wider);
                      }}
                    >
                      Try Wider Range
                    </Button>
                  </Box>
                )}
                </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
      )}
    </Container>
  );
};

export default ProductAnalysis;