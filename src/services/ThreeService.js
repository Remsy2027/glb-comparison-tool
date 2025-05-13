// ThreeService.js - Three.js utilities and model loading
import { THREE, GLTFLoader, DRACOLoader, RGBELoader, initializeThree } from '../utils/threeSetup.js';

export class ThreeService {
  static draco = null;
  static hdriLoader = null;
  static initialized = false;

  static async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const success = await initializeThree();
      if (!success) {
        throw new Error('Failed to initialize Three.js');
      }

      // Initialize Draco loader
      this.draco = new DRACOLoader();
      this.draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');

      // Initialize HDRI loader
      this.hdriLoader = new RGBELoader();
      this.hdriLoader.setDataType(THREE.UnsignedByteType);

      this.initialized = true;
      console.log('ThreeService initialized successfully');
    } catch (error) {
      console.error('Error initializing ThreeService:', error);
      throw error;
    }
  }

  static async loadModel(file) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const fileURL = URL.createObjectURL(file);
      
      const loader = new GLTFLoader();
      if (this.draco) {
        loader.setDRACOLoader(this.draco);
      }

      loader.load(
        fileURL,
        (gltf) => {
          URL.revokeObjectURL(fileURL);
          
          const scene = gltf.scene;
          const stats = this.analyzeModel(scene, file);
          
          resolve({ scene, stats });
        },
        (progress) => {
          console.log(`Loading progress: ${(progress.loaded / progress.total) * 100}%`);
        },
        (error) => {
          URL.revokeObjectURL(fileURL);
          reject(error);
        }
      );
    });
  }

  static analyzeModel(scene, file) {
    let vertexCount = 0;
    let triangleCount = 0;
    let materialCount = 0;
    const materials = new Set();
    const textures = new Map();

    scene.traverse((object) => {
      if (object.isMesh) {
        const geometry = object.geometry;
        
        // Count vertices and triangles
        if (geometry.index !== null) {
          triangleCount += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          triangleCount += geometry.attributes.position.count / 3;
        }
        
        if (geometry.attributes.position) {
          vertexCount += geometry.attributes.position.count;
        }
        
        // Analyze materials and textures
        if (object.material) {
          const materialsArray = Array.isArray(object.material) ? object.material : [object.material];
          
          materialsArray.forEach(material => {
            materials.add(material.uuid);
            
            // Analyze textures in the material
            const textureProperties = [
              { prop: 'map', name: 'Diffuse' },
              { prop: 'normalMap', name: 'Normal' },
              { prop: 'roughnessMap', name: 'Roughness' },
              { prop: 'metalnessMap', name: 'Metalness' },
              { prop: 'emissiveMap', name: 'Emissive' },
              { prop: 'aoMap', name: 'AO' },
              { prop: 'envMap', name: 'Environment' },
              { prop: 'alphaMap', name: 'Alpha' },
              { prop: 'bumpMap', name: 'Bump' },
              { prop: 'displacementMap', name: 'Displacement' }
            ];
            
            textureProperties.forEach(({ prop, name }) => {
              if (material[prop] && material[prop].image) {
                const textureName = material[prop].name || `${name}`;
                const count = textures.get(textureName) || 0;
                textures.set(textureName, count + 1);
              }
            });
          });
        }
      }
    });

    materialCount = materials.size;

    return {
      fileSize: file.size,
      vertexCount,
      triangleCount,
      materialCount,
      textureCount: textures.size,
      textures: Array.from(textures.entries())
    };
  }

  static setupEnvironment(renderer, scene, camera) {
    // Try to load HDR environment
    if (this.hdriLoader) {
      this.hdriLoader.load(
        'https://vc-catalog-bucket-dev.s3.ap-south-1.amazonaws.com/hdri/neutral.hdr',
        (texture) => {
          try {
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.environment = envMap;
            scene.background = new THREE.Color(0xffffff);
            
            texture.dispose();
            pmremGenerator.dispose();
            
            renderer.render(scene, camera);
          } catch (error) {
            console.warn('Error processing HDR environment map:', error);
            this.createFallbackLighting(scene);
          }
        },
        undefined,
        (error) => {
          console.warn('Error loading HDR environment map:', error);
          this.createFallbackLighting(scene);
        }
      );
    } else {
      this.createFallbackLighting(scene);
    }
  }

  static createFallbackLighting(scene) {
    // Create basic lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);
    
    scene.background = new THREE.Color(0xffffff);
  }
}