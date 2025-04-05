import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const earthRef = useRef(null);
  const ringsRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    
    // Set renderer size and add to DOM
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Camera position
    camera.position.z = 5;

    // Create a group to hold all objects
    const group = new THREE.Group();
    scene.add(group);

    // Create earth sphere with texture
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x4CAF50,
      shininess: 100,
      specular: 0x111111,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthRef.current = earth;
    group.add(earth);

    // Create rings around the earth
    const ringGeometry = new THREE.TorusGeometry(1.5, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0x4CAF50,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const rings = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = (i * Math.PI) / 3;
      rings.add(ring);
    }
    ringsRef.current = rings;
    group.add(rings);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional lights
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x4CAF50, 0.5);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Create floating particles with more dynamic movement
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 3000;
    const posArray = new Float32Array(particlesCount * 3);
    const velArray = new Float32Array(particlesCount * 3);
    const sizeArray = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
      velArray[i] = (Math.random() - 0.5) * 0.02;
      if (i % 3 === 0) {
        sizeArray[i / 3] = Math.random() * 0.03 + 0.01;
      }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    particlesRef.current = { mesh: particlesMesh, positions: posArray, velocities: velArray };
    group.add(particlesMesh);

    let time = 0;
    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Rotate earth with a slight wobble
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.005;
        earthRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      }

      // Rotate rings
      if (ringsRef.current) {
        ringsRef.current.rotation.y += 0.002;
        ringsRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
      }

      // Animate particles with dynamic movement
      if (particlesRef.current) {
        const { positions, velocities, mesh } = particlesRef.current;
        for (let i = 0; i < positions.length; i += 3) {
          // Update position based on velocity
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Add some noise to the movement
          positions[i] += Math.sin(time + i) * 0.001;
          positions[i + 1] += Math.cos(time + i) * 0.001;
          positions[i + 2] += Math.sin(time * 0.5 + i) * 0.001;

          // Wrap particles around when they go too far
          if (Math.abs(positions[i]) > 5) positions[i] *= -0.99;
          if (Math.abs(positions[i + 1]) > 5) positions[i + 1] *= -0.99;
          if (Math.abs(positions[i + 2]) > 5) positions[i + 2] *= -0.99;
        }
        mesh.geometry.attributes.position.needsUpdate = true;
      }

      // Update controls
      controls.update();

      renderer.render(scene, camera);
    };

    // Start animation
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      // Dispose of renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      particlesRef.current = null;
      earthRef.current = null;
      ringsRef.current = null;
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />;
};

export default ThreeScene; 