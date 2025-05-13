import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ThreeService } from '../services/ThreeService';
import { CameraSync } from '../services/CameraSync';

const ModelViewer = forwardRef(({ scene, type, syncEnabled = false }, ref) => {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const animationFrameRef = useRef();
  const changeListenerRef = useRef();

  console.log(`ModelViewer ${type} render - syncEnabled:`, syncEnabled); // Debug log

  useImperativeHandle(ref, () => ({
    getRenderer: () => rendererRef.current,
    getCamera: () => cameraRef.current,
    getControls: () => controlsRef.current,
    captureSnapshot: () => {
      if (rendererRef.current) {
        return rendererRef.current.domElement.toDataURL('image/png');
      }
      return null;
    }
  }));

  useEffect(() => {
    if (!scene || !canvasRef.current) return;

    const setupViewer = async () => {
      try {
        // Dynamic import of OrbitControls
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

        // Clean up previous renderer
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        // Create renderer
        const renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: true
        });
        
        const canvas = canvasRef.current;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.physicallyCorrectLights = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.0;
        renderer.outputEncoding = THREE.sRGBEncoding;
        
        rendererRef.current = renderer;

        // Create camera with standardized settings
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        cameraRef.current = camera;

        // Create controls with standardized settings
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.enableZoom = true;
        controlsRef.current = controls;

        // Standardized model positioning
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Calculate distance to fit the entire model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Add margin

        // Reset camera to a standardized position
        camera.position.set(0, 0, cameraZ);
        camera.lookAt(0, 0, 0);
        
        // Center the model at origin
        scene.position.set(-center.x, -center.y, -center.z);
        
        // Set controls target to the center
        controls.target.copy(new THREE.Vector3(0, 0, 0));
        controls.update();

        // Set up environment
        ThreeService.setupEnvironment(renderer, scene, camera);

        // Set up camera synchronization
        const setupSync = () => {
          // Remove existing listener if any
          if (changeListenerRef.current) {
            controls.removeEventListener('change', changeListenerRef.current);
          }

          if (syncEnabled) {
            console.log(`Setting up sync for ${type}`);
            
            // Register with camera sync
            CameraSync.registerViewer({ 
              getCamera: () => camera, 
              getControls: () => controls,
              getRenderer: () => renderer
            }, type);

            // Create change listener
            changeListenerRef.current = () => {
              if (CameraSync.isEnabled && !CameraSync.isSyncing) {
                console.log(`${type} camera changed, syncing...`);
                CameraSync.syncAllFromSource(type);
              }
            };

            controls.addEventListener('change', changeListenerRef.current);
          } else {
            console.log(`Removing sync for ${type}`);
            // Unregister from camera sync
            CameraSync.unregisterViewer(type);
          }
        };

        setupSync();

        // Animation loop
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          // Clean up sync listener
          if (changeListenerRef.current) {
            controls.removeEventListener('change', changeListenerRef.current);
          }
          // Unregister from camera sync
          CameraSync.unregisterViewer(type);
        };
      } catch (error) {
        console.error('Error setting up viewer:', error);
      }
    };

    setupViewer();
  }, [scene, syncEnabled, type]); // Add syncEnabled as dependency

  return (
    <div className="model-viewer">
      <div className="canvas-container">
        <canvas ref={canvasRef} />
        {!scene && (
          <div className="canvas-placeholder">
            <span>🎮</span>
            <p>Upload a model to view</p>
          </div>
        )}
      </div>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '5px', 
        borderRadius: '3px',
        fontSize: '12px'
      }}>
        {type} - {syncEnabled ? 'Sync ON' : 'Sync OFF'}
      </div>
    </div>
  );
});

export default ModelViewer;