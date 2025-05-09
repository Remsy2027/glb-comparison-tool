/**
 * Improved ModelViewer class
 * Handles 3D model visualization with better error handling and UI feedback
 */
class ModelViewer {
    /**
     * Create a new ModelViewer
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Additional options
     */
    constructor(containerId, options = {}) {    
        // DOM elements
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        // Check if container exists
        if (!this.container) {
            console.error(`Container element not found: ${containerId}`);
            return;
        }
        
        // Model data
        this.model = null;
        this.modelData = {
            fileName: '',
            fileSize: 0,
            vertices: 0,
            triangles: 0,
            materials: 0,
            textures: 0
        };
        
        // Options with defaults
        this.options = {
            autoRotate: true,
            useNeutralLighting: true,
            backgroundColor: 0xf0f0f0,
            cameraPosition: [0, 0, 5],
            cameraFov: 45,
            ...options
        };
        
        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.envMap = null;
        this.clock = new THREE.Clock();
        this.animationMixers = [];
        
        // Initialize the 3D viewer
        this.initScene();
        
        // Log initialization
        console.log(`ModelViewer initialized: ${containerId}`);
    }
    
    /**
     * Initialize the Three.js scene
     */
    initScene() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(this.options.backgroundColor);
            
            // Create camera
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(
                this.options.cameraFov, 
                aspect, 
                0.1, 
                1000
            );
            this.camera.position.set(
                this.options.cameraPosition[0],
                this.options.cameraPosition[1],
                this.options.cameraPosition[2]
            );
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                preserveDrawingBuffer: true, // Needed for screenshots
                alpha: true
            });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            this.container.appendChild(this.renderer.domElement);
            
            // Add controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = 1.0;
            
            // Add basic lighting
            this.addBasicLighting();
            
            // Load environment map if specified
            if (this.options.useNeutralLighting) {
                this.loadEnvironmentMap('assets/neutral.hdr');
            }
            
            // Add resize listener
            window.addEventListener('resize', this.onWindowResize.bind(this));
            
            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Error initializing scene:', error);
        }
    }
    
    /**
     * Add basic lighting to the scene
     */
    addBasicLighting() {
        try {
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 2, 3);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);
            
            // Add hemisphere light for better ambient illumination
            const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.5);
            this.scene.add(hemisphereLight);
        } catch (error) {
            console.error('Error adding lights:', error);
        }
    }
    
    /**
     * Load an HDR environment map
     * @param {string} path - Path to the HDR file
     */
    loadEnvironmentMap(path) {
        try {
            // Check if RGBELoader is available
            if (!THREE.RGBELoader) {
                console.error('THREE.RGBELoader not found. Make sure it is properly loaded.');
                return;
            }
            
            const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            pmremGenerator.compileEquirectangularShader();
            
            new THREE.RGBELoader()
                .load(path, 
                    // Success callback
                    (texture) => {
                        this.envMap = pmremGenerator.fromEquirectangular(texture).texture;
                        this.scene.environment = this.envMap;
                        
                        texture.dispose();
                        pmremGenerator.dispose();
                        
                        // Apply environment map to any existing model
                        if (this.model) {
                            this.applyEnvironmentMap();
                        }
                        
                        console.log(`Environment map loaded: ${path}`);
                    },
                    // Progress callback
                    undefined,
                    // Error callback
                    (error) => {
                        console.error('Error loading environment map:', error);
                        
                        // Fall back to basic lighting if HDR fails to load
                        console.log('Falling back to basic lighting');
                    }
                );
        } catch (error) {
            console.error('Error setting up environment map:', error);
        }
    }
    
    /**
     * Apply environment map to all materials in the model
     */
    applyEnvironmentMap() {
        if (!this.envMap || !this.model) return;
        
        try {
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            material.envMap = this.envMap;
                            material.envMapIntensity = 1.0;
                            material.needsUpdate = true;
                        });
                    } else {
                        child.material.envMap = this.envMap;
                        child.material.envMapIntensity = 1.0;
                        child.material.needsUpdate = true;
                    }
                }
            });
        } catch (error) {
            console.error('Error applying environment map:', error);
        }
    }
    
    /**
     * Load a GLB model
     * @param {ArrayBuffer} arrayBuffer - The GLB file as an ArrayBuffer
     * @param {string} fileName - Name of the file
     * @returns {Promise<boolean>} - Success state
     */
    async loadModel(arrayBuffer, fileName) {
        // Clear existing model
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
            this.animationMixers = [];
        }
        
        // Store file info
        this.modelData.fileName = fileName;
        this.modelData.fileSize = this.formatFileSize(arrayBuffer.byteLength);
        
        // Create object URL from array buffer
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const objectUrl = URL.createObjectURL(blob);
        
        try {
            // Check if GLTFLoader is available
            if (!THREE.GLTFLoader) {
                throw new Error('THREE.GLTFLoader not found. Make sure it is properly loaded.');
            }
            
            // Load the GLB model
            const loader = new THREE.GLTFLoader();
            
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    objectUrl,
                    resolve,
                    // Progress callback
                    (xhr) => {
                        if (xhr.lengthComputable) {
                            const percentComplete = (xhr.loaded / xhr.total) * 100;
                            console.log(`Loading model: ${Math.round(percentComplete)}%`);
                        }
                    },
                    reject
                );
            });
            
            // Get the model from the GLTF scene
            this.model = gltf.scene;
            
            // Setup animations if present
            if (gltf.animations && gltf.animations.length > 0) {
                console.log(`Model has ${gltf.animations.length} animations`);
                
                const mixer = new THREE.AnimationMixer(this.model);
                this.animationMixers.push(mixer);
                
                gltf.animations.forEach((clip, index) => {
                    mixer.clipAction(clip).play();
                });
            }
            
            // Apply environment map if available
            if (this.envMap) {
                this.applyEnvironmentMap();
            }
            
            // Add model to scene
            this.scene.add(this.model);
            
            // Center model
            this.centerModel();
            
            // Calculate statistics
            this.calculateModelStats();
            
            // Mark container as having a model
            this.container.parentElement.classList.add('has-model');
            
            console.log(`Model loaded successfully: ${fileName}`);
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            
            // Show notification if available
            if (typeof showNotification === 'function') {
                showNotification(`Error loading model: ${error.message}`, 'error');
            }
            
            return false;
        } finally {
            // Clean up
            URL.revokeObjectURL(objectUrl);
        }
    }
    
    /**
     * Center the model in the scene and adjust camera
     */
    centerModel() {
        if (!this.model) return;
        
        try {
            // Calculate bounding box
            const box = new THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Center model
            this.model.position.x = -center.x;
            this.model.position.y = -center.y;
            this.model.position.z = -center.z;
            
            // Calculate distance for camera
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraDistance = (maxDim / 2) / Math.tan(fov / 2);
            
            // Add margin
            cameraDistance *= 1.5;
            
            // Position camera
            this.camera.position.z = cameraDistance;
            this.camera.lookAt(0, 0, 0);
            
            // Reset controls
            this.controls.reset();
        } catch (error) {
            console.error('Error centering model:', error);
        }
    }
    
    /**
     * Calculate statistics for the loaded model
     */
    calculateModelStats() {
        if (!this.model) return;
        
        try {
            let vertices = 0;
            let triangles = 0;
            let materials = new Set();
            let textures = new Set();
            
            this.model.traverse((object) => {
                if (object.isMesh) {
                    const geometry = object.geometry;
                    
                    // Count vertices
                    if (geometry.attributes && geometry.attributes.position) {
                        vertices += geometry.attributes.position.count;
                    }
                    
                    // Count triangles
                    if (geometry.index) {
                        triangles += geometry.index.count / 3;
                    } else if (geometry.attributes && geometry.attributes.position) {
                        triangles += geometry.attributes.position.count / 3;
                    }
                    
                    // Count materials
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => materials.add(mat));
                        } else {
                            materials.add(object.material);
                        }
                    }
                    
                    // Count textures
                    if (object.material) {
                        const countTexturesInMaterial = (material) => {
                            const textureProps = [
                                'map', 'normalMap', 'displacementMap', 'bumpMap', 
                                'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'
                            ];
                            
                            textureProps.forEach(prop => {
                                if (material[prop]) {
                                    textures.add(material[prop]);
                                }
                            });
                        };
                        
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => countTexturesInMaterial(mat));
                        } else {
                            countTexturesInMaterial(object.material);
                        }
                    }
                }
            });
            
            this.modelData.vertices = vertices;
            this.modelData.triangles = Math.round(triangles);
            this.modelData.materials = materials.size;
            this.modelData.textures = textures.size;
            
            console.log('Model statistics calculated:', this.modelData);
        } catch (error) {
            console.error('Error calculating model stats:', error);
        }
    }
    
    /**
     * Format file size in human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    
    /**
     * Handle window resize event
     */
    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        try {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        } catch (error) {
            console.error('Error handling window resize:', error);
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        if (!this.renderer) return;
        
        requestAnimationFrame(this.animate.bind(this));
        
        try {
            // Update controls
            if (this.controls) {
                this.controls.update();
            }
            
            // Update animations
            const delta = this.clock.getDelta();
            this.animationMixers.forEach(mixer => {
                mixer.update(delta);
            });
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Error in animation loop:', error);
        }
    }
    
    /**
     * Get model statistics
     * @returns {Object} - Model statistics
     */
    getModelStats() {
        return { ...this.modelData };
    }
    
    /**
     * Check if a model is loaded
     * @returns {boolean} - True if a model is loaded
     */
    hasModel() {
        return this.model !== null;
    }
    
    /**
     * Set auto-rotation
     * @param {boolean} autoRotate - Enable/disable auto-rotation
     */
    setAutoRotate(autoRotate) {
        this.options.autoRotate = autoRotate;
        if (this.controls) {
            this.controls.autoRotate = autoRotate;
        }
    }
    
    /**
     * Set camera position
     * @param {Array<number>} position - [x, y, z] position
     */
    setCameraPosition(position) {
        if (this.camera && position && position.length === 3) {
            this.camera.position.set(position[0], position[1], position[2]);
            this.camera.lookAt(0, 0, 0);
        }
    }
    
    /**
     * Capture a screenshot of the current view
     * @returns {Promise<string>} - Data URL of the screenshot
     */
    captureScreenshot() {
        return new Promise((resolve, reject) => {
            if (!this.renderer) {
                return reject(new Error('Renderer not initialized'));
            }
            
            try {
                // Save current auto-rotate state
                const wasAutoRotating = this.controls.autoRotate;
                
                // Temporarily disable auto-rotation
                this.controls.autoRotate = false;
                
                // Render a frame
                this.renderer.render(this.scene, this.camera);
                
                // Capture the image
                const dataUrl = this.renderer.domElement.toDataURL('image/png');
                
                // Restore auto-rotate state
                this.controls.autoRotate = wasAutoRotating;
                
                resolve(dataUrl);
            } catch (error) {
                console.error('Error capturing screenshot:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Sync lighting with another ModelViewer
     * @param {ModelViewer} sourceViewer - Source viewer to sync with
     */
    syncLightingWith(sourceViewer) {
        if (!(sourceViewer instanceof ModelViewer)) {
            console.error('Invalid sourceViewer. Must be an instance of ModelViewer.');
            return;
        }

        try {
            // Sync environment map
            if (sourceViewer.envMap) {
                this.envMap = sourceViewer.envMap;
                this.scene.environment = this.envMap;
                if (this.model) {
                    this.applyEnvironmentMap();
                }
            }

            // Remove existing lights
            this.scene.children = this.scene.children.filter(obj => 
                !(obj instanceof THREE.Light)
            );

            // Clone lights from the sourceViewer
            sourceViewer.scene.children.forEach(child => {
                if (child instanceof THREE.Light) {
                    const clonedLight = child.clone();
                    this.scene.add(clonedLight);
                }
            });

            console.log('Lighting synchronized with source viewer.');
        } catch (error) {
            console.error('Error syncing lighting:', error);
        }
    }
}