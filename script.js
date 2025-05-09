// Load or generate environment map
function setupEnvironment(renderer, scene, camera) {
  // Try to load HDR first
  new THREE.RGBELoader()
    .setDataType(THREE.UnsignedByteType) // For better compatibility
    .load('https://vc-catalog-bucket-dev.s3.ap-south-1.amazonaws.com/hdri/neutral.hdr', function(texture) {
      try {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        
        
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        scene.background = new THREE.Color(0xffffff); // White background for product view
        
        texture.dispose();
        pmremGenerator.dispose();
        
        // Render once environment is loaded
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('Error processing HDR environment map, using synthetic environment:', error);
        createSyntheticEnvironment(renderer, scene);
      }
    }, undefined, function(error) {
      console.warn('Error loading HDR environment map, using synthetic environment:', error);
      
      // Fallback to traditional lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight1.position.set(1, 1, 1);
      scene.add(directionalLight1);
      
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-1, 0.5, -1);
      scene.add(directionalLight2);
      
      scene.background = new THREE.Color(0xffffff);
      
      // Render once lights are added
      renderer.render(scene, camera);
    });
}  // Create a synthetic environment map if loading fails
function createSyntheticEnvironment(renderer, scene) {
  // Create a simple cube map
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  
  // Create a simple scene for the cube camera
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x88ccee);
  
  // Add gradient to the sky
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `;
  
  const uniforms = {
    topColor: { value: new THREE.Color(0x0077ff) },
    bottomColor: { value: new THREE.Color(0xffffff) },
    offset: { value: 33 },
    exponent: { value: 0.6 }
  };
  
  const skyGeo = new THREE.SphereGeometry(500, 32, 15);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeo, skyMat);
  envScene.add(sky);
  
  // Add some soft light sources
  const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
  light1.position.set(1, 1, 1);
  envScene.add(light1);
  
  const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
  light2.position.set(-1, 0.5, -1);
  envScene.add(light2);
  
  const light3 = new THREE.DirectionalLight(0xffffff, 0.3);
  light3.position.set(0, -1, 0);
  envScene.add(light3);
  
  // Render the cube map
  cubeCamera.update(renderer, envScene);
  
  // Set the environment map
  scene.environment = cubeRenderTarget.texture;
  scene.background = new THREE.Color(0xffffff); // White background
  
  return cubeRenderTarget.texture;
}// Global variables
let originalFile = null;
let comparisonFile = null;
let originalScene = null;
let comparisonScene = null;
let originalRenderer = null;
let comparisonRenderer = null;
let originalCamera = null;
let comparisonCamera = null;
let originalControls = null;
let comparisonControls = null;
let originalSnapshot = null;
let comparisonSnapshot = null;
let diffImageData = null;

// Fallback pixelmatch implementation in case the library fails to load
// This is a simplified version that just highlights differences in red
function simplePixelMatch(img1, img2, output, width, height, options) {
const threshold = options && options.threshold !== undefined ? options.threshold : 0.1;
let differentPixels = 0;

// Compare pixels and mark differences
for (let i = 0; i < img1.length; i += 4) {
  // Get RGB values (ignore alpha)
  const r1 = img1[i];
  const g1 = img1[i + 1];
  const b1 = img1[i + 2];
  
  const r2 = img2[i];
  const g2 = img2[i + 1];
  const b2 = img2[i + 2];
  
  // Calculate simple color difference (you can use more complex methods)
  const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
  const normalizedDiff = colorDiff / 765; // 255*3 = 765 (max possible difference)
  
  if (normalizedDiff > threshold) {
    // Difference detected - mark in red
    output[i] = 255;     // R
    output[i + 1] = 0;   // G
    output[i + 2] = 0;   // B
    output[i + 3] = 255; // A
    differentPixels++;
  } else {
    // No significant difference - use original pixel
    output[i] = r1;
    output[i + 1] = g1;
    output[i + 2] = b1;
    output[i + 3] = 255;
  }
}

return differentPixels;
}

// DOM elements
const originalFileInput = document.getElementById('original-file-input');
const comparisonFileInput = document.getElementById('comparison-file-input');
const originalCanvas = document.getElementById('original-canvas');
const comparisonCanvas = document.getElementById('comparison-canvas');
const originalStatsContainer = document.getElementById('original-stats');
const comparisonStatsContainer = document.getElementById('comparison-stats');
const compareButton = document.getElementById('compare-button');
const downloadReportButton = document.getElementById('download-report-button');
const resultsContainer = document.getElementById('results-container');
const originalImage = document.getElementById('original-image');
const comparisonImage = document.getElementById('comparison-image');
const diffImage = document.getElementById('diff-image');
const diffPercentage = document.getElementById('diff-percentage');
const summaryText = document.getElementById('summary-text');
const diffCanvas = document.getElementById('diff-canvas');

// Check if required libraries are loaded
function checkLibraries() {
if (!window.THREE) {
  console.error('THREE.js library not loaded');
  return false;
}

if (!window.THREE.GLTFLoader) {
  console.error('GLTFLoader not loaded');
  return false;
}

if (!window.THREE.DRACOLoader) {
  console.error('DRACOLoader not loaded');
  return false;
}

if (!window.THREE.RGBELoader) {
  console.error('RGBELoader not loaded');
  return false;
}

if (!window.THREE.PMREMGenerator) {
  console.error('PMREMGenerator not loaded');
  return false;
}

if (!window.THREE.OrbitControls) {
  console.error('OrbitControls not loaded');
  return false;
}

return true;
}

// Event listeners
window.addEventListener('load', () => {
if (!checkLibraries()) {
  alert('Required libraries not loaded. Please refresh the page and try again.');
  return;
}
});

originalFileInput.addEventListener('change', (event) => {
const file = event.target.files[0];
if (file) {
  originalFile = file;
  processGLBFile(file, 'original');
}
});

comparisonFileInput.addEventListener('change', (event) => {
const file = event.target.files[0];
if (file) {
  comparisonFile = file;
  processGLBFile(file, 'comparison');
}
});

compareButton.addEventListener('click', compareModels);
downloadReportButton.addEventListener('click', downloadReport);

// Process GLB file
function processGLBFile(file, type) {
const fileURL = URL.createObjectURL(file);

// Set up Draco loader for compressed models
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');

// Initialize GLTFLoader with Draco support
const loader = new THREE.GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load(
  fileURL,
  (gltf) => {
    // Calculate statistics for the model
    const stats = analyzeModel(gltf.scene, file);
    
    if (type === 'original') {
      displayStats(stats, originalStatsContainer);
      setupScene(gltf.scene, originalCanvas, 'original');
    } else {
      displayStats(stats, comparisonStatsContainer);
      setupScene(gltf.scene, comparisonCanvas, 'comparison');
    }
    
    // Enable compare button if both models are loaded
    if (originalScene && comparisonScene) {
      compareButton.disabled = false;
    }
  },
  (xhr) => {
    console.log(`${type} model ${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  (error) => {
    console.error(`Error loading ${type} model:`, error);
    
    if (type === 'original') {
      originalStatsContainer.innerHTML = `<div class="error-message">Error loading model: ${error.message}</div>`;
    } else {
      comparisonStatsContainer.innerHTML = `<div class="error-message">Error loading model: ${error.message}</div>`;
    }
  }
);
}

// Analyze model and calculate statistics
function analyzeModel(scene, file) {
let vertexCount = 0;
let triangleCount = 0;
let materialCount = 0;
const materials = new Set();

scene.traverse((object) => {
  if (object.isMesh) {
    const geometry = object.geometry;
    
    if (geometry.index !== null) {
      triangleCount += geometry.index.count / 3;
    } else if (geometry.attributes.position) {
      triangleCount += geometry.attributes.position.count / 3;
    }
    
    if (geometry.attributes.position) {
      vertexCount += geometry.attributes.position.count;
    }
    
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => materials.add(mat.uuid));
      } else {
        materials.add(object.material.uuid);
      }
    }
  }
});

materialCount = materials.size;

return {
  fileSize: file.size,
  vertexCount,
  triangleCount,
  materialCount
};
}

// Display statistics in the UI
function displayStats(stats, container) {
container.innerHTML = `
  <div>File Size:</div>
  <div>${formatBytes(stats.fileSize)}</div>
  
  <div>Vertices:</div>
  <div>${formatNumber(stats.vertexCount)}</div>
  
  <div>Triangles:</div>
  <div>${formatNumber(stats.triangleCount)}</div>
  
  <div>Materials:</div>
  <div>${formatNumber(stats.materialCount)}</div>
`;
}

// Setup 3D scene with HDR environment lighting
function setupScene(model, canvas, type) {
// Set up scene
const scene = new THREE.Scene();

// Camera setup
const width = canvas.clientWidth;
const height = canvas.clientHeight;
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

// Renderer with preserveDrawingBuffer for screenshots
const renderer = new THREE.WebGLRenderer({ 
  canvas: canvas, 
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);

// Enable physically correct lighting and tone mapping (important for material fidelity)
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

// Add orbit controls for interactive viewing
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 1.5;
controls.enableZoom = true;

// Add model to scene
scene.add(model);

// Center model and calculate bounding box
const box = new THREE.Box3().setFromObject(model);
const center = box.getCenter(new THREE.Vector3());
const size = box.getSize(new THREE.Vector3());

// Calculate distance for camera to view the entire model
const maxDim = Math.max(size.x, size.y, size.z);
const fov = camera.fov * (Math.PI / 180);
let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
cameraZ *= 1.5; // Add some margin

// Position camera
camera.position.z = cameraZ;

// Center the model
model.position.x = -center.x;
model.position.y = -center.y;
model.position.z = -center.z;

// Setup environment (HDR or synthetic)
setupEnvironment(renderer, scene, camera);

// Store scene, camera, controls and renderer based on type
if (type === 'original') {
  // Clean up previous scene if it exists
  if (originalRenderer) {
    originalRenderer.dispose();
  }
  
  originalScene = scene;
  originalCamera = camera;
  originalRenderer = renderer;
  originalControls = controls;
} else {
  // Clean up previous scene if it exists
  if (comparisonRenderer) {
    comparisonRenderer.dispose();
  }
  
  comparisonScene = scene;
  comparisonCamera = camera;
  comparisonRenderer = renderer;
  comparisonControls = controls;
}

// Start animation loop
animate(type);
}

// Animation loop for models
function animate(type) {
let scene, camera, renderer, controls;

if (type === 'original' && originalScene && originalCamera && originalRenderer) {
  scene = originalScene;
  camera = originalCamera;
  renderer = originalRenderer;
  controls = originalControls;
} else if (type === 'comparison' && comparisonScene && comparisonCamera && comparisonRenderer) {
  scene = comparisonScene;
  camera = comparisonCamera;
  renderer = comparisonRenderer;
  controls = comparisonControls;
} else {
  return;
}

const animationFrame = requestAnimationFrame(() => animate(type));

// Update orbit controls
if (controls) {
  controls.update();
}

renderer.render(scene, camera);
}

// Compare models using pixelmatch
function compareModels() {
if (!originalScene || !comparisonScene) {
  alert('Both models must be loaded to compare.');
  return;
}

// Set both cameras to the same position and orientation for fair comparison
const viewPosition = new THREE.Vector3().copy(originalCamera.position);
comparisonCamera.position.copy(viewPosition);
comparisonCamera.quaternion.copy(originalCamera.quaternion);

// Disable controls temporarily
if (originalControls) originalControls.enabled = false;
if (comparisonControls) comparisonControls.enabled = false;

// Render scenes with identical camera positions
originalRenderer.render(originalScene, originalCamera);
comparisonRenderer.render(comparisonScene, comparisonCamera);

// Capture screenshots
originalSnapshot = originalRenderer.domElement.toDataURL('image/png');
comparisonSnapshot = comparisonRenderer.domElement.toDataURL('image/png');

// Re-enable controls
if (originalControls) originalControls.enabled = true;
if (comparisonControls) comparisonControls.enabled = true;

// When both images are loaded, perform comparison
Promise.all([
  loadImage(originalSnapshot),
  loadImage(comparisonSnapshot)
]).then(([img1, img2]) => {
  // Draw images to hidden canvases for pixelmatch
  const width = img1.width;
  const height = img1.height;
  
  // Create canvas contexts to get pixel data
  const canvas1 = document.createElement('canvas');
  const canvas2 = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  canvas1.width = width;
  canvas1.height = height;
  canvas2.width = width;
  canvas2.height = height;
  
  const ctx1 = canvas1.getContext('2d');
  const ctx2 = canvas2.getContext('2d');
  const ctxDiff = diffCanvas.getContext('2d');
  
  // Draw images to canvases
  ctx1.drawImage(img1, 0, 0);
  ctx2.drawImage(img2, 0, 0);
  
  // Get pixel data
  const imgData1 = ctx1.getImageData(0, 0, width, height);
  const imgData2 = ctx2.getImageData(0, 0, width, height);
  const diffData = ctxDiff.createImageData(width, height);
  
  // Run pixelmatch comparison - with fallback if library is loaded differently
  let mismatchedPixels;
  try {
    // Try global pixelmatch function
    if (typeof window.pixelmatch === 'function') {
      mismatchedPixels = window.pixelmatch(
        imgData1.data, 
        imgData2.data, 
        diffData.data, 
        width, 
        height, 
        { 
          threshold: 0.05,  // Lower threshold for more sensitivity (like Google Material Fidelity)
          includeAA: false, // Ignore anti-aliasing differences
          alpha: 0.1,       // Slight blending of original
          diffColor: [255, 0, 0], // Red for differences
          diffMask: false   // Show differences on original image
        }
      );
    } else {
      console.warn('Using fallback pixel comparison function');
      mismatchedPixels = simplePixelMatch(
        imgData1.data, 
        imgData2.data, 
        diffData.data, 
        width, 
        height, 
        { threshold: 0.05 }
      );
    }
  } catch (error) {
    console.error('Error using pixelmatch, falling back to simple implementation:', error);
    mismatchedPixels = simplePixelMatch(
      imgData1.data, 
      imgData2.data, 
      diffData.data, 
      width, 
      height, 
      { threshold: 0.05 }
    );
  }
  
  // Calculate percentage difference
  const totalPixels = width * height;
  const diffPercentageValue = (mismatchedPixels / totalPixels) * 100;
  
  // Put diff image data to canvas
  ctxDiff.putImageData(diffData, 0, 0);
  
  // Convert diff canvas to data URL
  const diffDataURL = diffCanvas.toDataURL('image/png');
  
  // Update UI with results
  originalImage.src = originalSnapshot;
  comparisonImage.src = comparisonSnapshot;
  diffImage.src = diffDataURL;
  diffPercentage.textContent = `Difference: ${diffPercentageValue.toFixed(2)}%`;
  
  // Create summary text with additional Material Fidelity context
  let summaryClass = '';
  let summaryText = '';
  
  if (diffPercentageValue < 1) {
    summaryClass = 'excellent';
    summaryText = `The models are visually identical with only ${diffPercentageValue.toFixed(2)}% difference, which is excellent. This is within the range Google Material Fidelity considers a high-quality match.`;
  } else if (diffPercentageValue < 5) {
    summaryClass = 'good';
    summaryText = `The models have a ${diffPercentageValue.toFixed(2)}% difference, which is good. Small variations are visible but likely acceptable for most use cases.`;
  } else if (diffPercentageValue < 15) {
    summaryClass = 'moderate';
    summaryText = `The models have a moderate ${diffPercentageValue.toFixed(2)}% difference. Noticeable variations exist in materials, geometry, or lighting.`;
  } else {
    summaryClass = 'significant';
    summaryText = `The models have a significant ${diffPercentageValue.toFixed(2)}% difference. Major variations exist that require attention.`;
  }
  
  // Update the summary text and add class
  document.getElementById('summary-text').textContent = summaryText;
  document.getElementById('summary-text').className = `summary-text ${summaryClass}`;
  
  // Store diff image data for report
  diffImageData = diffDataURL;
  
  // Show results container and enable download button
  resultsContainer.classList.remove('hidden');
  downloadReportButton.disabled = false;
  
}).catch(error => {
  console.error('Error comparing images:', error);
  alert('Error comparing images. Please try again.');
});
}

// Helper function to load an image from data URL
function loadImage(dataURL) {
return new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = dataURL;
});
}

// Generate and download report
function downloadReport() {
if (!originalSnapshot || !comparisonSnapshot || !diffImageData) {
  alert('Please compare models first to generate a report.');
  return;
}

// Create a simple HTML report
const reportHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GLB Comparison Report</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3 {
        color: #2c3e50;
      }
      .images {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin: 20px 0;
      }
      .image-container {
        flex: 1;
        min-width: 300px;
        text-align: center;
      }
      img {
        max-width: 100%;
        border: 1px solid #ddd;
      }
      .summary {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
      }
      .timestamp {
        color: #7f8c8d;
        font-size: 14px;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <h1>GLB Comparison Report</h1>
    
    <div class="summary">
      <h2>Comparison Results</h2>
      <h3>${diffPercentage.textContent}</h3>
      <p>${summaryText.textContent}</p>
    </div>
    
    <div class="images">
      <div class="image-container">
        <h3>Original Model</h3>
        <img src="${originalSnapshot}" alt="Original Model">
      </div>
      
      <div class="image-container">
        <h3>Comparison Model</h3>
        <img src="${comparisonSnapshot}" alt="Comparison Model">
      </div>
      
      <div class="image-container">
        <h3>Difference Visualization</h3>
        <img src="${diffImageData}" alt="Difference Visualization">
      </div>
    </div>
    
    <div class="timestamp">
      Report generated on ${new Date().toLocaleString()}
    </div>
  </body>
  </html>
`;

// Create blob and download link
const blob = new Blob([reportHTML], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `glb-comparison-report-${Date.now()}.html`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
if (bytes === 0) return '0 Bytes';

const k = 1024;
const dm = decimals < 0 ? 0 : decimals;
const sizes = ['Bytes', 'KB', 'MB', 'GB'];

const i = Math.floor(Math.log(bytes) / Math.log(k));

return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to format numbers with commas
function formatNumber(num) {
return num ? num.toLocaleString() : 0;
}

// Adjust canvas sizes on window resize
window.addEventListener('resize', () => {
if (originalRenderer && originalCamera) {
  const width = originalCanvas.clientWidth;
  const height = originalCanvas.clientHeight;
  originalCamera.aspect = width / height;
  originalCamera.updateProjectionMatrix();
  originalRenderer.setSize(width, height);
}

if (comparisonRenderer && comparisonCamera) {
  const width = comparisonCanvas.clientWidth;
  const height = comparisonCanvas.clientHeight;
  comparisonCamera.aspect = width / height;
  comparisonCamera.updateProjectionMatrix();
  comparisonRenderer.setSize(width, height);
}
});