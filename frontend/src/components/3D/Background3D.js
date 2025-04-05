import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useTheme } from '../../contexts/ThemeContext';
import * as THREE from 'three';

// Animated leaf particle
const Leaf = ({ position, rotation, scale, color }) => {
  const mesh = useRef();
  
  // Random movement
  useFrame(() => {
    mesh.current.position.y -= 0.01;
    mesh.current.rotation.x += 0.01;
    mesh.current.rotation.y += 0.01;
    
    // Reset position when leaf goes below screen
    if (mesh.current.position.y < -10) {
      mesh.current.position.y = 15;
      mesh.current.position.x = Math.random() * 20 - 10;
      mesh.current.position.z = Math.random() * 10 - 5;
    }
  });
  
  return (
    <animated.mesh 
      ref={mesh} 
      position={position} 
      rotation={rotation} 
      scale={scale}
    >
      <tetrahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.7} 
        metalness={0.2}
        roughness={0.8}
      />
    </animated.mesh>
  );
};

// Animated waves
const Waves = ({ color, darkMode }) => {
  const mesh = useRef();
  const { viewport } = useThree();
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.5;
    mesh.current.material.uniforms.time.value = t;
  });
  
  // Create shader material for the waves
  const waveMaterial = {
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(color) },
      amplitude: { value: darkMode ? 0.4 : 0.2 }
    },
    vertexShader: `
      uniform float time;
      uniform float amplitude;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float dist = distance(vec2(0.5), vUv) * 2.0;
        pos.z += sin(dist * 3.0 - time) * amplitude * (1.0 - dist);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec2 vUv;
      void main() {
        float intensity = 1.05 - distance(vec2(0.5), vUv);
        gl_FragColor = vec4(color * intensity, 0.3);
      }
    `
  };
  
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} scale={[viewport.width * 2, viewport.height * 2, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial 
        attach="material"
        args={[waveMaterial]}
        transparent
      />
    </mesh>
  );
};

// Main scene component
const Scene = () => {
  const { darkMode } = useTheme();
  const lightColor = darkMode ? '#4caf50' : '#60ad5e';
  const ambientColor = darkMode ? '#1e1e1e' : '#ffffff';
  
  // Create leaves
  const leaves = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    position: [Math.random() * 20 - 10, Math.random() * 10, Math.random() * 10 - 5],
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    scale: [0.8 + Math.random() * 0.5, 0.8 + Math.random() * 0.5, 0.8 + Math.random() * 0.5],
    color: i % 2 === 0 ? '#4caf50' : '#8bc34a'
  }));
  
  return (
    <>
      <ambientLight intensity={darkMode ? 0.2 : 0.5} color={ambientColor} />
      <pointLight position={[10, 10, 10]} intensity={darkMode ? 0.5 : 0.3} color={lightColor} />
      <pointLight position={[-10, -10, -5]} intensity={darkMode ? 0.2 : 0.1} color={lightColor} />
      
      {/* Animated leaves */}
      {leaves.map(leaf => (
        <Leaf key={leaf.id} {...leaf} />
      ))}
      
      {/* Animated waves */}
      <Waves color={darkMode ? '#388e3c' : '#81c784'} darkMode={darkMode} />
    </>
  );
};

// Main component with canvas
const Background3D = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className="background-canvas">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: darkMode 
            ? 'linear-gradient(to bottom, #121212, #1a1a1a)' 
            : 'linear-gradient(to bottom, #e8f5e9, #f5f5f5)'
        }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default Background3D; 