import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ThreeService } from '../services/ThreeService';

const ModelViewer = forwardRef(({ scene, type }, ref) => {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const animationFrameRef = useRef();

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

        // Create camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        cameraRef.current = camera;

        // Create controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.enableZoom = true;
        controlsRef.current = controls;

        // Position camera and model
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5;

        camera.position.z = cameraZ;
        
        scene.position.x = -center.x;
        scene.position.y = -center.y;
        scene.position.z = -center.z;

        // Set up environment
        ThreeService.setupEnvironment(renderer, scene, camera);

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
        };
      } catch (error) {
        console.error('Error setting up viewer:', error);
      }
    };

    setupViewer();
  }, [scene]);

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
    </div>
  );
});

export default ModelViewer;