// threeSetup.js - Initialize Three.js without conflicts
import * as THREE from 'three';

let GLTFLoader, DRACOLoader, RGBELoader, OrbitControls;

export async function initializeThree() {
  try {
    // Dynamic imports to avoid read-only issues
    const GLTFModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const DRACOModule = await import('three/examples/jsm/loaders/DRACOLoader.js');
    const RGBEModule = await import('three/examples/jsm/loaders/RGBELoader.js');
    const ControlsModule = await import('three/examples/jsm/controls/OrbitControls.js');
    
    GLTFLoader = GLTFModule.GLTFLoader;
    DRACOLoader = DRACOModule.DRACOLoader;
    RGBELoader = RGBEModule.RGBELoader;
    OrbitControls = ControlsModule.OrbitControls;
    
    // Make THREE available globally
    window.THREE = THREE;
    
    console.log('Three.js initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Three.js:', error);
    return false;
  }
}

export { THREE, GLTFLoader, DRACOLoader, RGBELoader, OrbitControls };