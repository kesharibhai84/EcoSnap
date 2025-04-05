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
  CardMedia,
  useTheme,
  Rating,
  Tooltip,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RecyclingIcon from '@mui/icons-material/Recycling';
import Slider from '@mui/material/Slider';
import ProductChatBot from '../components/ProductChatBot';
import InfoIcon from '@mui/icons-material/Info';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NatureIcon from '@mui/icons-material/Nature';
import { useAuth } from '../contexts/AuthContext';

const ProductAnalysis = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [maxPriceRange, setMaxPriceRange] = useState(5000);

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
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          color: theme.palette.mode === 'dark' ? 'primary.light' : 'text.primary'
        }}
      >
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
            sx={{ 
              mb: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark'
              }
            }}
          >
            Upload Product Image
          </Button>
        </label>

        {image && (
          <Box sx={{ 
            mt: 2,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.shadows[2]
          }}>
            <img
              src={image}
              alt="Product"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px', 
                display: 'block',
                margin: '0 auto'
              }}
            />
          </Box>
        )}

        <TextField
          fullWidth
          label="Product Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          sx={{ 
            mt: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              },
            },
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || !image || !price}
          sx={{ 
            mt: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark'
            }
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Product'}
        </Button>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'error.dark' : 'error.light',
              color: theme.palette.mode === 'dark' ? 'error.light' : 'error.dark'
            }}
          >
            {error}
          </Alert>
        )}
      </Box>

      {analysis && (
        <Grid container spacing={3}>
          {/* Product Details Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none'
            }}>
              <CardContent sx={{ 
                flexGrow: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'text.primary' }}>
                    Product Details
                  </Typography>
                </Box>
                <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary' }}>
                  {analysis.name || 'Product Name'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalOfferIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.primary' }}>
                    Price: ${analysis.price || '0'}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.primary' }}>
                  Ingredients
                </Typography>
                <List dense>
                  {analysis.ingredients && analysis.ingredients.length > 0 ? (
                    analysis.ingredients.map((ingredient, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <FiberManualRecordIcon sx={{ 
                            fontSize: '0.5rem',
                            color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'
                          }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={ingredient}
                          sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.primary' }}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No ingredients available
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Environmental Impact Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none'
            }}>
              <CardContent sx={{ 
                flexGrow: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NatureIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'text.primary' }}>
                    Environmental Impact
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h4" color="primary" sx={{ mr: 2 }}>
                    {analysis.carbonFootprint?.score || 0}/100
                  </Typography>
                  <Rating 
                    value={(analysis.carbonFootprint?.score || 0) / 20} 
                    readOnly 
                    precision={0.5}
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                      '& .MuiRating-iconEmpty': {
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                      }
                    }}
                  />
                </Box>
                
                <Accordion 
                  defaultExpanded 
                  sx={{ 
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 1
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    <Typography variant="subtitle2">Impact Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Manufacturing Impact
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Slider
                          value={analysis.carbonFootprint?.details?.manufacturing?.score || 0}
                          disabled
                          sx={{ 
                            mx: 2, 
                            flexGrow: 1,
                            color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                            '& .MuiSlider-track': {
                              backgroundColor: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'
                            },
                            '& .MuiSlider-rail': {
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.primary' }}>
                          {analysis.carbonFootprint?.details?.manufacturing?.score || 0}/100
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Transportation Impact
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Slider
                          value={analysis.carbonFootprint?.details?.transportation?.score || 0}
                          disabled
                          sx={{ mx: 2, flexGrow: 1 }}
                        />
                        <Typography variant="body2">
                          {analysis.carbonFootprint?.details?.transportation?.score || 0}/100
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Packaging Impact
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Slider
                          value={analysis.carbonFootprint?.details?.packaging?.score || 0}
                          disabled
                          sx={{ mx: 2, flexGrow: 1 }}
                        />
                        <Typography variant="body2">
                          {analysis.carbonFootprint?.details?.packaging?.score || 0}/100
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>

          {/* Similar Products Section */}
          <Grid item xs={12}>
            <Card sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none'
            }}>
              <CardContent sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper'
              }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'text.primary' }}
                >
                  Similar Products
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </Typography>
                  <Slider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={maxPriceRange}
                    sx={{ 
                      mt: 2,
                      color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                      '& .MuiSlider-track': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main'
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
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
                      sx={{
                        color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                        borderColor: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                        '&:hover': {
                          borderColor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark'
                        }
                      }}
                      variant="outlined"
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
                      sx={{
                        color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                        borderColor: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                        '&:hover': {
                          borderColor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark'
                        }
                      }}
                      variant="outlined"
                    >
                      Show All
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 3,
                  justifyContent: 'center'
                }}>
                  {filteredProducts && filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <Card 
                        key={index}
                        sx={{ 
                          width: '500px',
                          height: '300px',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease-in-out',
                          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
                          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          height: '100%',
                          position: 'relative'
                        }}>
                          <Box sx={{ 
                            width: '50%',
                            height: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper'
                          }}>
                            <CardMedia
                              component="img"
                              image={product.imageUrl}
                              alt={product.name}
                              sx={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                p: 2,
                                transition: 'transform 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }}
                            />
                          </Box>
                          <Box sx={{ 
                            width: '50%',
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper'
                          }}>
                            <Box>
                              <Typography 
                                variant="h5" 
                                component="div" 
                                noWrap
                                sx={{ 
                                  fontWeight: 'bold',
                                  mb: 2,
                                  color: theme.palette.mode === 'dark' ? 'text.primary' : 'text.primary'
                                }}
                              >
                                {product.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <LocalOfferIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.2rem' }} />
                                <Typography variant="h6" sx={{ color: theme.palette.mode === 'dark' ? 'text.secondary' : 'text.primary' }}>
                                  ${product.price || '0'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <NatureIcon sx={{ mr: 1, color: 'success.main', fontSize: '1.2rem' }} />
                                <Typography variant="h6" color="text.secondary">
                                  Eco Score: {product.carbonFootprint?.score || 0}/100
                                </Typography>
                              </Box>
                            </Box>
                            <Button 
                              size="large" 
                              color="primary"
                              variant="contained"
                              sx={{ 
                                mt: 2,
                                alignSelf: 'flex-start',
                                px: 3,
                                py: 1,
                                bgcolor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.main',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : 'primary.dark'
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    ))
                  ) : (
                    <Box sx={{ 
                      width: '100%', 
                      py: 4, 
                      textAlign: 'center',
                      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper'
                    }}>
                      <Typography variant="body1" color="text.secondary">
                        No similar products found
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Chatbot */}
      {analysis && <ProductChatBot product={analysis} />}
    </Container>
  );
};

export default ProductAnalysis;