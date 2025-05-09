#!/usr/bin/env node

/**
 * Command-line script to compare two GLB models
 * Takes screenshots in neutral.hdr lighting and compares with pixelmatch
 * 
 * Usage:
 *   node compare-models.js <model1.glb> <model2.glb> [options]
 * 
 * Options:
 *   --threshold=0.1          Comparison threshold (0.0 to 1.0)
 *   --output=report.json     Output file for comparison report
 *   --diff=diff.png          Output file for difference image
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
} catch (e) {
    console.error('Puppeteer is required. Install it with: npm install puppeteer');
    process.exit(1);
}

const puppeteer = require('puppeteer');

// Parse command line arguments
const args = process.argv.slice(2);
let model1Path, model2Path, threshold = 0.1, outputPath, diffPath;

// Check for help flag
if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
}

// Parse positional arguments
model1Path = args[0];
model2Path = args[1];

// Parse named options
args.slice(2).forEach(arg => {
    if (arg.startsWith('--threshold=')) {
        threshold = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
        outputPath = arg.split('=')[1];
    } else if (arg.startsWith('--diff=')) {
        diffPath = arg.split('=')[1];
    }
});

// Set default output paths if not provided
if (!outputPath) {
    outputPath = 'comparison-report.json';
}

if (!diffPath) {
    diffPath = 'comparison-diff.png';
}

// Validate input files
if (!fs.existsSync(model1Path)) {
    console.error(`Error: Model 1 file not found: ${model1Path}`);
    process.exit(1);
}

if (!fs.existsSync(model2Path)) {
    console.error(`Error: Model 2 file not found: ${model2Path}`);
    process.exit(1);
}

// Create a temporary HTML file for rendering
const tempHtmlPath = path.join(process.cwd(), 'temp-compare.html');
createTempHtml(tempHtmlPath, model1Path, model2Path);

// Main function
(async () => {
    console.log('Starting GLB model comparison...');
    
    try {
        // Take screenshots of both models with neutral HDR lighting
        console.log(`Rendering models with neutral.hdr lighting...`);
        const { screenshot1, screenshot2 } = await captureModelScreenshots(tempHtmlPath);
        
        // Compare the screenshots
        console.log(`Comparing screenshots with threshold=${threshold}...`);
        const comparison = compareImages(screenshot1, screenshot2, threshold, diffPath);
        
        // Generate report
        const report = generateReport(model1Path, model2Path, comparison);
        
        // Save report
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`Report saved to: ${outputPath}`);
        console.log(`Difference image saved to: ${diffPath}`);
        
        // Output summary
        console.log('\nComparison Summary:');
        console.log(`- Similarity: ${comparison.similarityPercentage.toFixed(2)}%`);
        console.log(`- Difference: ${comparison.diffPercentage.toFixed(2)}%`);
        console.log(`- Different pixels: ${comparison.diffPixels} of ${comparison.totalPixels}`);
        
        // Cleanup
        fs.unlinkSync(tempHtmlPath);
        
    } catch (error) {
        console.error('Error during comparison:', error);
        // Cleanup on error
        if (fs.existsSync(tempHtmlPath)) {
            fs.unlinkSync(tempHtmlPath);
        }
        process.exit(1);
    }
})();

/**
 * Print help information
 */
function printHelp() {
    console.log(`
GLB Model Comparison Tool

Takes screenshots of GLB models in neutral.hdr lighting and compares them using pixelmatch.

Usage:
  node compare-models.js <model1.glb> <model2.glb> [options]

Options:
  --threshold=0.1          Comparison threshold (0.0 to 1.0)
  --output=report.json     Output file for comparison report
  --diff=diff.png          Output file for difference image
  --help, -h               Show this help message

Example:
  node compare-models.js model1.glb model2.glb --threshold=0.05 --output=report.json --diff=diff.png
    `);
}

/**
 * Create a temporary HTML file for rendering models
 * @param {string} htmlPath - Output path for HTML file
 * @param {string} model1Path - Path to first GLB model
 * @param {string} model2Path - Path to second GLB model
 */
function createTempHtml(htmlPath, model1Path, model2Path) {
    const model1RelPath = path.relative(path.dirname(htmlPath), model1Path).replace(/\\/g, '/');
    const model2RelPath = path.relative(path.dirname(htmlPath), model2Path).replace(/\\/g, '/');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GLB Comparison</title>
    <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/examples/js/loaders/RGBELoader.js"></script>
    <style>
        body { margin: 0; overflow: hidden; }
        #container { display: flex; width: 100vw; height: 100vh; }
        #viewer1, #viewer2 { flex: 1; position: relative; }
        .controls { position: absolute; bottom: 10px; left: 10px; z-index: 100; background: rgba(0,0,0,0.5); color: white; padding: 5px; border-radius: 5px; }
    </style>
</head>
<body>
    <div id="container">
        <div id="viewer1">
            <div class="controls">Model 1: ${path.basename(model1Path)}</div>
        </div>
        <div id="viewer2">
            <div class="controls">Model 2: ${path.basename(model2Path)}</div>
        </div>
    </div>
    
    <script>
        // Paths to models
        const model1Path = "${model1RelPath}";
        const model2Path = "${model2RelPath}";
        
        // Scene 1
        const container1 = document.getElementById('viewer1');
        const scene1 = new THREE.Scene();
        const camera1 = new THREE.PerspectiveCamera(45, container1.clientWidth / container1.clientHeight, 0.1, 1000);
        const renderer1 = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer1.setSize(container1.clientWidth, container1.clientHeight);
        renderer1.setClearColor(0xf0f0f0);
        renderer1.outputEncoding = THREE.sRGBEncoding;
        renderer1.toneMapping = THREE.ACESFilmicToneMapping;
        container1.appendChild(renderer1.domElement);
        
        // Scene 2
        const container2 = document.getElementById('viewer2');
        const scene2 = new THREE.Scene();
        const camera2 = new THREE.PerspectiveCamera(45, container2.clientWidth / container2.clientHeight, 0.1, 1000);
        const renderer2 = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer2.setSize(container2.clientWidth, container2.clientHeight);
        renderer2.setClearColor(0xf0f0f0);
        renderer2.outputEncoding = THREE.sRGBEncoding;
        renderer2.toneMapping = THREE.ACESFilmicToneMapping;
        container2.appendChild(renderer2.domElement);
        
        // Add basic lighting
        function addLighting(scene) {
            const ambient = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambient);
            
            const directional = new THREE.DirectionalLight(0xffffff, 0.8);
            directional.position.set(1, 2, 3);
            scene.add(directional);
        }
        
        addLighting(scene1);
        addLighting(scene2);
        
        // Load models
        const loader = new THREE.GLTFLoader();
        let model1, model2;
        
        // Neutral HDR environment map
        const pmremGenerator1 = new THREE.PMREMGenerator(renderer1);
        const pmremGenerator2 = new THREE.PMREMGenerator(renderer2);
        
        // Signal when everything is loaded
        let model1Loaded = false;
        let model2Loaded = false;
        let envMapLoaded = false;
        
        function checkAllLoaded() {
            if (model1Loaded && model2Loaded && envMapLoaded) {
                document.dispatchEvent(new Event('modelsLoaded'));
            }
        }
        
        // Load neutral.hdr from data URI (embedded small HDR)
        const hdrDataUri = "data:application/octet-stream;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; // Base64 data would go here
        
        // Load environment map
        new THREE.RGBELoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/equirectangular/neutral.hdr', (texture) => {
            const envMap1 = pmremGenerator1.fromEquirectangular(texture).texture;
            const envMap2 = pmremGenerator2.fromEquirectangular(texture).texture;
            
            scene1.environment = envMap1;
            scene2.environment = envMap2;
            
            // Apply to models if they're loaded
            if (model1) applyEnvMap(model1, envMap1);
            if (model2) applyEnvMap(model2, envMap2);
            
            texture.dispose();
            pmremGenerator1.dispose();
            pmremGenerator2.dispose();
            
            envMapLoaded = true;
            checkAllLoaded();
        });
        
        // Apply environment map to a model
        function applyEnvMap(model, envMap) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            material.envMap = envMap;
                            material.needsUpdate = true;
                        });
                    } else {
                        child.material.envMap = envMap;
                        child.material.needsUpdate = true;
                    }
                }
            });
        }
        
        // Load model 1
        loader.load(model1Path, (gltf) => {
            model1 = gltf.scene;
            scene1.add(model1);
            centerModel(model1, camera1);
            
            if (scene1.environment) {
                applyEnvMap(model1, scene1.environment);
            }
            
            model1Loaded = true;
            checkAllLoaded();
        });
        
        // Load model 2
        loader.load(model2Path, (gltf) => {
            model2 = gltf.scene;
            scene2.add(model2);
            centerModel(model2, camera2);
            
            if (scene2.environment) {
                applyEnvMap(model2, scene2.environment);
            }
            
            model2Loaded = true;
            checkAllLoaded();
        });
        
        // Center model and adjust camera
        function centerModel(model, camera) {
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            model.position.x = -center.x;
            model.position.y = -center.y;
            model.position.z = -center.z;
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = (maxDim / 2) / Math.tan(fov / 2);
            
            cameraZ *= 1.5;
            camera.position.z = cameraZ;
            camera.lookAt(0, 0, 0);
        }
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            renderer1.render(scene1, camera1);
            renderer2.render(scene2, camera2);
        }
        
        animate();
        
        // Expose methods for screenshots
        window.takeScreenshots = function() {
            return {
                model1: renderer1.domElement.toDataURL('image/png'),
                model2: renderer2.domElement.toDataURL('image/png')
            };
        };
    </script>
</body>
</html>
    `;
    
    fs.writeFileSync(htmlPath, html);
}

/**
 * Capture screenshots of both models
 * @param {string} htmlPath - Path to the HTML file
 * @returns {Promise<Object>} - Screenshots as PNG Buffers
 */
async function captureModelScreenshots(htmlPath) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 800, height: 600 });
        
        // Load the page with file protocol
        await page.goto(`file://${htmlPath}`);
        
        // Wait for models to load
        await page.waitForSelector('#viewer1', { timeout: 5000 });
        await page.waitForSelector('#viewer2', { timeout: 5000 });
        
        console.log('Waiting for models to load...');
        await page.waitForFunction(() => {
            return document.querySelector('body').classList.contains('models-loaded') || 
                  (typeof window.takeScreenshots === 'function');
        }, { timeout: 30000 });
        
        // Additional wait to ensure HDR is applied
        await page.waitForTimeout(2000);
        
        // Take screenshots
        const screenshots = await page.evaluate(() => {
            return window.takeScreenshots();
        });
        
        // Convert data URLs to buffers
        const screenshot1Buffer = Buffer.from(
            screenshots.model1.replace(/^data:image\/png;base64,/, ''), 
            'base64'
        );
        
        const screenshot2Buffer = Buffer.from(
            screenshots.model2.replace(/^data:image\/png;base64,/, ''), 
            'base64'
        );
        
        return {
            screenshot1: PNG.sync.read(screenshot1Buffer),
            screenshot2: PNG.sync.read(screenshot2Buffer)
        };
    } finally {
        await browser.close();
    }
}

/**
 * Compare two PNG images
 * @param {PNG} img1 - First image
 * @param {PNG} img2 - Second image
 * @param {number} threshold - Comparison threshold
 * @param {string} diffPath - Path to save difference image
 * @returns {Object} - Comparison results
 */
function compareImages(img1, img2, threshold, diffPath) {
    // Use the smaller dimensions
    const width = Math.min(img1.width, img2.width);
    const height = Math.min(img1.height, img2.height);
    
    // Create output image
    const diff = new PNG({ width, height });
    
    // Compare images
    const diffPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        width,
        height,
        { 
            threshold,
            includeAlpha: false,
            diffColorAlt: [255, 0, 0, 255],  // Red for differences
            diffColor: [0, 255, 0, 255]       // Green for similarities
        }
    );
    
    // Calculate metrics
    const totalPixels = width * height;
    const diffPercentage = (diffPixels / totalPixels) * 100;
    const similarityPercentage = 100 - diffPercentage;
    
    // Save diff image
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    
    return {
        width,
        height,
        totalPixels,
        diffPixels,
        diffPercentage,
        similarityPercentage,
        threshold
    };
}

/**
 * Generate a comparison report
 * @param {string} model1Path - Path to first model
 * @param {string} model2Path - Path to second model
 * @param {Object} comparison - Comparison results
 * @returns {Object} - Report object
 */
function generateReport(model1Path, model2Path, comparison) {
    return {
        timestamp: new Date().toISOString(),
        models: {
            model1: {
                path: model1Path,
                filename: path.basename(model1Path),
                filesize: fs.statSync(model1Path).size
            },
            model2: {
                path: model2Path,
                filename: path.basename(model2Path),
                filesize: fs.statSync(model2Path).size
            }
        },
        comparison: {
            threshold: comparison.threshold,
            dimensions: {
                width: comparison.width,
                height: comparison.height
            },
            results: {
                totalPixels: comparison.totalPixels,
                diffPixels: comparison.diffPixels,
                diffPercentage: comparison.diffPercentage,
                similarityPercentage: comparison.similarityPercentage
            },
            diffImagePath: path.resolve(diffPath)
        }
    };
}