import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  InputAdornment,
  Rating,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Theme colors
const themeColors = {
  primary: '#1976d2',
  secondary: '#f5f5f5',
  accent: '#4caf50',
  text: '#333333',
  lightText: '#757575',
  cardBg: '#ffffff',
  highlight: '#e3f2fd',
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const frameId = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    if (canvasRef.current) {
      initThreeJS();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      if (sceneRef.current) {
        disposeScene();
      }
    };
  }, []);

  // Update 3D scene when products change
  useEffect(() => {
    if (products.length > 0 && sceneRef.current) {
      if (!activeProduct) {
        setActiveProduct(products[0]);
      } else {
        updateProductVisuals();
      }
    }
  }, [products, activeProduct]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
      if (response.data.length > 0) {
        setActiveProduct(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const initThreeJS = () => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / 400, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef.current,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(5, 5, 5);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      particles: [],
      lights: [ambientLight, pointLight, directionalLight],
    };

    // Animation loop
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);

      // Animate particles
      sceneRef.current.particles.forEach((particle) => {
        if (particle.userData.isParticle) {
          particle.rotation.x += 0.01;
          particle.rotation.y += 0.01;
          particle.position.y += Math.sin(Date.now() * 0.001 + particle.userData.offset) * 0.002;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  };

  const updateProductVisuals = () => {
    if (!sceneRef.current || !activeProduct) return;
    const { scene } = sceneRef.current;

    // Clear existing particles
    sceneRef.current.particles.forEach((particle) => {
      scene.remove(particle);
    });
    sceneRef.current.particles = [];

    const ecoScore = activeProduct.carbonFootprint.score;
    const particleCount = Math.floor(ecoScore / 10) + 8;

    // Color based on eco score (green for high, red for low)
    const hue = (ecoScore / 100) * 0.3; // 0.3 = green, 0 = red
    const color = new THREE.Color().setHSL(hue, 1, 0.5);

    // Center object
    const centerGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const centerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1976d2,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
    });
    const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
    centerMesh.castShadow = true;
    centerMesh.receiveShadow = true;
    scene.add(centerMesh);
    sceneRef.current.particles.push(centerMesh);

    // Particles
    for (let i = 0; i < particleCount; i++) {
      let geometry;
      const geometryType = i % 4;
      switch (geometryType) {
        case 0:
          geometry = new THREE.IcosahedronGeometry(0.2, 0);
          break;
        case 1:
          geometry = new THREE.OctahedronGeometry(0.2, 0);
          break;
        case 2:
          geometry = new THREE.TetrahedronGeometry(0.2, 0);
          break;
        default:
          geometry = new THREE.SphereGeometry(0.2, 8, 8);
      }

      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.9,
        emissive: color,
        emissiveIntensity: 0.2,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.userData = { isParticle: true, offset: i };
      particle.castShadow = true;

      // Spiral arrangement
      const angle = (i / particleCount) * Math.PI * 6;
      const radius = 1.5 + i * 0.15;
      const verticalOffset = (i / particleCount) * 2 - 1;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y = verticalOffset;

      scene.add(particle);
      sceneRef.current.particles.push(particle);
    }
  };

  const handleResize = () => {
    if (!sceneRef.current) return;
    const { camera, renderer } = sceneRef.current;
    const width = window.innerWidth;
    const height = 400;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const disposeScene = () => {
    const { scene, renderer } = sceneRef.current;
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    renderer.dispose();
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEcoRating = (score) => score / 20; // 0-100 => 0-5

  const handleCardClick = (product) => {
    setActiveProduct(product);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x300/eee?text=Product';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'; // green
    if (score >= 60) return '#8bc34a'; // light green
    if (score >= 40) return '#ffc107'; // amber
    if (score >= 20) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  return (
    <Container maxWidth="lg" ref={containerRef} sx={{ py: 4 }}>
      {/* View Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" color={themeColors.text}>
          Eco Products
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              width: { xs: '100%', sm: 220 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: themeColors.secondary,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{ minWidth: 0, px: 1.5 }}
            >
              Grid
            </Button> */}
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('list')}
              sx={{ minWidth: 0, px: 1.5 }}
            >
              List
            </Button>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <Grid container spacing={3} alignItems="stretch">
              {filteredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <Card
                    sx={{
                      // Force a uniform height for each card
                      width: '100%',
                      height: 360,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow:
                        activeProduct && activeProduct._id === product._id
                          ? '0 8px 40px rgba(25, 118, 210, 0.3)'
                          : '0 4px 12px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                      },
                      border:
                        activeProduct && activeProduct._id === product._id
                          ? `2px solid ${themeColors.primary}`
                          : 'none',
                      bgcolor: themeColors.cardBg,
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleCardClick(product)}
                  >
                    {/* Eco Score Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: getScoreColor(product.carbonFootprint.score),
                        color: 'white',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 1,
                      }}
                    >
                      {product.carbonFootprint.score}
                    </Box>

                    {/* Fixed-height image area: 200px */}
                    <Box
                      sx={{
                        height: 200,
                        minHeight: 200,
                        maxHeight: 200,
                        width: '100%',
                        position: 'relative',
                        bgcolor: themeColors.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component="img"
                        src={product.imageUrl}
                        alt={product.name}
                        onError={handleImageError}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      />
                    </Box>

                    {/* The remaining 160px for content */}
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        // Force the content area to be 160px (360 - 200 for image)
                        height: 'calc(100% - 200px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            fontWeight: 600,
                            color: themeColors.text,
                            // Two-line clamp to prevent overflow
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {product.name}
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: themeColors.primary,
                            mb: 1,
                          }}
                        >
                          ${product.price}
                        </Typography>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, color: themeColors.lightText }}>
                            Eco Rating:
                          </Typography>
                          <Rating
                            value={getEcoRating(product.carbonFootprint.score)}
                            precision={0.5}
                            readOnly
                            size="small"
                            emptyIcon={<StarIcon style={{ opacity: 0.3 }} fontSize="inherit" />}
                          />
                        </Box>

                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<ShoppingCartIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          Add to Cart
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // List View
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredProducts.map((product) => (
                <Card
                  key={product._id}
                  sx={{
                    display: 'flex',
                    transition: 'all 0.3s ease',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow:
                      activeProduct && activeProduct._id === product._id
                        ? '0 8px 40px rgba(25, 118, 210, 0.3)'
                        : '0 4px 12px rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                    },
                    border:
                      activeProduct && activeProduct._id === product._id
                        ? `2px solid ${themeColors.primary}`
                        : 'none',
                    bgcolor: themeColors.cardBg,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleCardClick(product)}
                >
                  {/* Image container (list view) */}
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      bgcolor: themeColors.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      component="img"
                      src={product.imageUrl}
                      alt={product.name}
                      onError={handleImageError}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: 2,
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      p: 2,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: themeColors.text,
                          // For very long names, clamp or truncate as needed
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.name}
                      </Typography>

                      <Chip
                        size="small"
                        label={`Score: ${product.carbonFootprint.score}`}
                        sx={{
                          bgcolor: getScoreColor(product.carbonFootprint.score),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1, color: themeColors.lightText }}>
                        Eco Rating:
                      </Typography>
                      <Rating
                        value={getEcoRating(product.carbonFootprint.score)}
                        precision={0.5}
                        readOnly
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: themeColors.primary }}>
                        ${product.price}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      {filteredProducts.length === 0 && !loading && (
        <Box
          sx={{
            mt: 6,
            p: 4,
            textAlign: 'center',
            bgcolor: themeColors.secondary,
            borderRadius: 4,
          }}
        >
          <Typography variant="h6" color={themeColors.lightText}>
            No products found matching your search
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ProductList;
