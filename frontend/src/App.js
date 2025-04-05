import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductAnalysis from './pages/ProductAnalysis';
import ProductList from './pages/ProductList';
import ProductDetails from './components/ProductDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AuthTest from './pages/AuthTest';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/animations.css';
// Remove the import of 3dEffects.css for now until we create it
// import './styles/3dEffects.css';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<ProductAnalysis />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth-test" element={<AuthTest />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
