import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Rating
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../../contexts/ThemeContext';
import StarIcon from '@mui/icons-material/Star';

// Custom styled components
const AnimatedCard = animated(Card);

const ProductCard3D = ({ product }) => {
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { darkMode } = useTheme();
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  // Reset animation state on mount
  useEffect(() => {
    api.start({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      rotateX: 0,
      rotateY: 0,
      shadow: darkMode ? '0 10px 30px -5px rgba(0,0,0,0.5)' : '0 10px 30px -5px rgba(0,0,0,0.1)',
    });
  }, [darkMode]);

  // Calculate eco rating (1-5 stars)
  const getEcoRating = (score) => {
    return Math.max(1, Math.min(5, Math.round(score / 20)));
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return muiTheme.palette.eco.excellent;
    if (score >= 60) return muiTheme.palette.eco.good;
    if (score >= 40) return muiTheme.palette.eco.average;
    if (score >= 20) return muiTheme.palette.eco.poor;
    return muiTheme.palette.eco.bad;
  };

  // 3D transform effect
  const [{ transform, rotateX, rotateY, shadow }, api] = useSpring(() => ({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
    rotateX: 0,
    rotateY: 0,
    shadow: darkMode ? '0 10px 30px -5px rgba(0,0,0,0.5)' : '0 10px 30px -5px rgba(0,0,0,0.1)',
    config: { mass: 1, tension: 300, friction: 40 }
  }));

  // Mouse move handler for 3D effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXVal = (mouseY / (rect.height / 2)) * -10;
    const rotateYVal = (mouseX / (rect.width / 2)) * 10;
    
    api.start({
      rotateX: rotateXVal,
      rotateY: rotateYVal,
      transform: `perspective(1000px) rotateX(${rotateXVal}deg) rotateY(${rotateYVal}deg) scale(1.05)`,
      shadow: `0 ${15 + Math.abs(rotateXVal)}px ${30 + Math.abs(rotateYVal)}px -5px rgba(0,0,0,${darkMode ? 0.6 : 0.15})`,
    });
    
    setHovered(true);
  };

  // Reset transform on mouse leave
  const handleMouseLeave = () => {
    api.start({
      rotateX: 0,
      rotateY: 0,
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      shadow: darkMode ? '0 10px 30px -5px rgba(0,0,0,0.5)' : '0 10px 30px -5px rgba(0,0,0,0.1)',
    });
    
    setHovered(false);
  };

  // Navigate to product details
  const handleClick = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <AnimatedCard
      ref={cardRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        boxShadow: shadow,
        transformStyle: 'preserve-3d',
        transition: 'background-color 0.3s ease',
        backgroundColor: hovered 
          ? (darkMode ? '#1a1a1a' : '#ffffff') 
          : (darkMode ? '#2a2a2a' : '#f8f8f8'),
        cursor: 'pointer'
      }}
      className="product-card-3d"
    >
      <Box 
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          height: 180
        }}
      >
        {/* Eco score badge */}
        <Chip
          label={`Eco: ${product.carbonFootprint.score}`}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
            bgcolor: getScoreColor(product.carbonFootprint.score),
            color: '#fff',
            fontWeight: 'bold',
            transform: hovered ? 'translateZ(40px)' : 'translateZ(0)',
            transition: 'transform 0.3s ease',
            boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
          }}
        />
        
        {/* Product image with 3D effect */}
        <Box
          component="img"
          src={product.imageUrl}
          alt={product.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.05) translateZ(30px)' : 'scale(1) translateZ(0)',
            transition: 'transform 0.3s ease',
            filter: darkMode ? 'brightness(0.85)' : 'none'
          }}
        />
      </Box>
      
      <CardContent 
        sx={{ 
          transform: hovered ? 'translateZ(20px)' : 'translateZ(0)',
          transition: 'transform 0.3s ease',
          color: darkMode ? '#ffffff' : 'inherit'
        }}
      >
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          noWrap
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: darkMode ? '#ffffff' : 'inherit'
          }}
        >
          {product.name}
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1,
            opacity: 0.9
          }}
        >
          <Typography variant="body2" sx={{ mr: 1, color: darkMode ? '#ffffff' : 'inherit' }}>
            Eco Rating:
          </Typography>
          <Rating
            value={getEcoRating(product.carbonFootprint.score)}
            precision={0.5}
            readOnly
            size="small"
            emptyIcon={<StarIcon style={{ opacity: darkMode ? 0.5 : 0.3 }} fontSize="inherit" />}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          color={darkMode ? "text.secondary" : "text.secondary"}
          sx={{ 
            height: 40, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit'
          }}
        >
          {product.ingredients.slice(0, 2).join(', ')}
          {product.ingredients.length > 2 && '...'}
        </Typography>
      </CardContent>
    </AnimatedCard>
  );
};

export default ProductCard3D; 