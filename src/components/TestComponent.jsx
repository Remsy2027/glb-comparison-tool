import React, { useEffect } from 'react';
import * as THREE from 'three';

const TestComponent = () => {
  useEffect(() => {
    console.log('THREE object:', THREE);
    console.log('THREE version:', THREE.REVISION);
    
    try {
      // Try to create a simple scene
      const scene = new THREE.Scene();
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      console.log('Basic Three.js setup successful');
    } catch (error) {
      console.error('Error with Three.js:', error);
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Three.js Test Component</h2>
      <p>Check the console for Three.js information.</p>
    </div>
  );
};

export default TestComponent;