import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle
} from 'react';
import * as THREE from 'three';
import { ThreeService } from '../services/ThreeService';
import { CameraSync } from '../services/CameraSync';

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
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

        if (rendererRef.current) {
          rendererRef.current.dispose();
        }

        const canvas = canvasRef.current;
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: true
        });

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.physicallyCorrectLights = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.0;
        renderer.outputEncoding = THREE.sRGBEncoding;

        rendererRef.current = renderer;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controlsRef.current = controls;

        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5;

        camera.position.set(0, 0, cameraZ);
        camera.lookAt(0, 0, 0);
        scene.position.set(-center.x, -center.y, -center.z);
        controls.target.copy(new THREE.Vector3(0, 0, 0));
        controls.update();

        ThreeService.setupEnvironment(renderer, scene, camera);

        CameraSync.registerViewer({
          getCamera: () => camera,
          getControls: () => controls,
          getRenderer: () => renderer
        }, type);

        let lastSyncTime = 0;
        const syncDelay = 16;

        const handleChange = () => {
          const now = Date.now();
          if (now - lastSyncTime > syncDelay) {
            lastSyncTime = now;
            CameraSync.syncFromSource(type);
          }
        };

        controls.addEventListener('change', handleChange);
        controls.addEventListener('start', handleChange);
        controls.addEventListener('end', handleChange);

        const handleMouseMove = (event) => {
          if (event.buttons > 0) handleChange();
        };

        const handleWheel = () => handleChange();

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('touchmove', handleChange);

        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

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
          controls.removeEventListener('change', handleChange);
          controls.removeEventListener('start', handleChange);
          controls.removeEventListener('end', handleChange);
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('wheel', handleWheel);
          canvas.removeEventListener('touchmove', handleChange);
          CameraSync.unregisterViewer(type);
        };
      } catch (error) {
        console.error('Error setting up viewer:', error);
      }
    };

    const cleanup = setupViewer();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(fn => fn && fn());
      }
    };
  }, [scene, type]);

  return (
    <div className="model-viewer">
      <div className="canvas-container">
        <canvas ref={canvasRef} />
        {!scene && (
          <div className="canvas-placeholder">
            <span role="img" aria-label="controller">🎮</span>
            <p>Upload a model to view</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default ModelViewer;