#!/usr/bin/env node

/**
 * Batch processing script for comparing multiple GLB models
 * 
 * Usage:
 *   node batch-process.js --dir=models --output=reports
 * 
 * Options:
 *   --dir=<directory>     Directory containing GLB models to compare
 *   --output=<directory>  Directory to save reports and diff images
 *   --threshold=0.1       Comparison threshold (0.0 to 1.0)
 *   --reference=<file>    Optional reference model to compare all models against
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let modelDir, outputDir, threshold = 0.1, referenceModel;

// Check for help flag
if (args.includes('-h') || args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
}

// Parse named options
args.forEach(arg => {
    if (arg.startsWith('--dir=')) {
        modelDir = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
        outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--threshold=')) {
        threshold = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--reference=')) {
        referenceModel = arg.split('=')[1];
    }
});

// Validate arguments
if (!modelDir) {
    console.error('Error: No model directory specified. Use --dir=<directory>');
    process.exit(1);
}

if (!fs.existsSync(modelDir)) {
    console.error(`Error: Model directory not found: ${modelDir}`);
    process.exit(1);
}

if (!outputDir) {
    outputDir = 'comparison-reports';
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Find all GLB files in the directory
const modelFiles = fs.readdirSync(modelDir)
    .filter(file => file.toLowerCase().endsWith('.glb'))
    .map(file => path.join(modelDir, file));

// Validate we have enough models
if (modelFiles.length === 0) {
    console.error(`Error: No GLB files found in directory: ${modelDir}`);
    process.exit(1);
}

if (!referenceModel && modelFiles.length < 2) {
    console.error('Error: At least two GLB files are required for comparison');
    process.exit(1);
}

// If reference model is provided, validate it
if (referenceModel) {
    if (!fs.existsSync(referenceModel)) {
        console.error(`Error: Reference model not found: ${referenceModel}`);
        process.exit(1);
    }
    
    console.log(`Using reference model: ${referenceModel}`);
}

// Main process
(async () => {
    console.log(`Batch processing ${modelFiles.length} GLB files...`);
    console.log(`Output directory: ${outputDir}`);
    
    // Generate list of comparisons to run
    const comparisons = [];
    
    if (referenceModel) {
        // Compare all models against the reference
        modelFiles.forEach(modelFile => {
            if (path.resolve(modelFile) !== path.resolve(referenceModel)) {
                comparisons.push({
                    model1: referenceModel,
                    model2: modelFile,
                    outputName: `${path.basename(referenceModel, '.glb')}_vs_${path.basename(modelFile, '.glb')}`
                });
            }
        });
    } else {
        // Compare all models against each other
        for (let i = 0; i < modelFiles.length; i++) {
            for (let j = i + 1; j < modelFiles.length; j++) {
                comparisons.push({
                    model1: modelFiles[i],
                    model2: modelFiles[j],
                    outputName: `${path.basename(modelFiles[i], '.glb')}_vs_${path.basename(modelFiles[j], '.glb')}`
                });
            }
        }
    }
    
    console.log(`Running ${comparisons.length} comparisons...`);
    
    // Run each comparison
    const results = [];
    for (let i = 0; i < comparisons.length; i++) {
        const comparison = comparisons[i];
        console.log(`\nComparison ${i + 1}/${comparisons.length}:`);
        console.log(`  ${path.basename(comparison.model1)} vs ${path.basename(comparison.model2)}`);
        
        try {
            const result = await runComparison(
                comparison.model1,
                comparison.model2,
                path.join(outputDir, `${comparison.outputName}.json`),
                path.join(outputDir, `${comparison.outputName}.png`),
                threshold
            );
            
            results.push({
                models: {
                    model1: path.basename(comparison.model1),
                    model2: path.basename(comparison.model2)
                },
                similarity: result.similarityPercentage,
                difference: result.diffPercentage,
                outputName: comparison.outputName
            });
        } catch (error) {
            console.error(`  Error: ${error.message}`);
        }
    }
    
    // Generate summary report
    const summary = {
        timestamp: new Date().toISOString(),
        models: modelFiles.map(file => path.basename(file)),
        referenceModel: referenceModel ? path.basename(referenceModel) : null,
        comparisonCount: comparisons.length,
        threshold,
        results: results.sort((a, b) => b.similarity - a.similarity)
    };
    
    fs.writeFileSync(
        path.join(outputDir, 'summary-report.json'),
        JSON.stringify(summary, null, 2)
    );
    
    // Print summary
    console.log('\nSummary Report:');
    console.log('---------------');
    console.log(`Total Comparisons: ${results.length}`);
    
    if (results.length > 0) {
        console.log('\nMost Similar:');
        const mostSimilar = [...results].sort((a, b) => b.similarity - a.similarity)[0];
        console.log(`  ${mostSimilar.models.model1} vs ${mostSimilar.models.model2}: ${mostSimilar.similarity.toFixed(2)}% similar`);
        
        console.log('\nLeast Similar:');
        const leastSimilar = [...results].sort((a, b) => a.similarity - b.similarity)[0];
        console.log(`  ${leastSimilar.models.model1} vs ${leastSimilar.models.model2}: ${leastSimilar.similarity.toFixed(2)}% similar`);
    }
    
    console.log(`\nDetailed results saved to: ${path.join(outputDir, 'summary-report.json')}`);
})();

/**
 * Print help information
 */
function printHelp() {
    console.log(`
GLB Model Batch Comparison Tool

Usage:
  node batch-process.js --dir=models --output=reports

Options:
  --dir=<directory>     Directory containing GLB models to compare
  --output=<directory>  Directory to save reports and diff images
  --threshold=0.1       Comparison threshold (0.0 to 1.0)
  --reference=<file>    Optional reference model to compare all models against
  --help, -h            Show this help message

Example:
  node batch-process.js --dir=models --output=reports --threshold=0.05 --reference=reference.glb
    `);
}

/**
 * Run a comparison between two models
 * @param {string} model1Path - Path to first model
 * @param {string} model2Path - Path to second model
 * @param {string} outputPath - Path for output report
 * @param {string} diffPath - Path for difference image
 * @param {number} threshold - Comparison threshold
 * @returns {Promise<Object>} - Comparison results
 */
function runComparison(model1Path, model2Path, outputPath, diffPath, threshold) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'compare-models.js');
        
        const process = spawn('node', [
            scriptPath,
            model1Path,
            model2Path,
            `--threshold=${threshold}`,
            `--output=${outputPath}`,
            `--diff=${diffPath}`
        ]);
        
        let output = '';
        let errorOutput = '';
        
        process.stdout.on('data', (data) => {
            const text = data.toString();
            console.log(`  ${text.trim()}`);
            output += text;
        });
        
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
            }
            
            try {
                const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                resolve(report.comparison.results);
            } catch (error) {
                reject(new Error(`Failed to parse comparison results: ${error.message}`));
            }
        });
    });
}