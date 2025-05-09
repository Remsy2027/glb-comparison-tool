/**
 * Main application script (Fixed version)
 * Initializes the GLB model comparison tool
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const model1FileInput = document.getElementById('model1-file');
    const model2FileInput = document.getElementById('model2-file');
    const compareBtn = document.getElementById('compare-btn');
    const saveComparisonBtn = document.getElementById('save-comparison');
    const autoRotateCheckbox = document.getElementById('auto-rotate');
    const sameLightingCheckbox = document.getElementById('same-lighting');
    const thresholdSlider = document.getElementById('threshold');
    const thresholdValue = document.getElementById('threshold-value');
    const model1Stats = document.getElementById('model1-stats');
    const model2Stats = document.getElementById('model2-stats');
    const diffCanvas = document.getElementById('diff-canvas');
    
    // Check if required elements exist
    if (!compareBtn || !diffCanvas) {
        console.error('Required DOM elements are missing');
        return;
    }
    
    // Initialize model viewers with default settings
    const viewerOptions = {
        autoRotate: autoRotateCheckbox ? autoRotateCheckbox.checked : true,
        useNeutralLighting: sameLightingCheckbox ? sameLightingCheckbox.checked : true,
        backgroundColor: 0xf0f0f0
    };
    
    // Create model viewers
    const modelViewer1 = new ModelViewer('viewer-1', viewerOptions);
    const modelViewer2 = new ModelViewer('viewer-2', viewerOptions);
    
    // Initialize model comparator with default threshold
    const modelComparator = new ModelComparator({
        threshold: thresholdSlider ? parseFloat(thresholdSlider.value) : 0.1
    });
    
    // Setup drag and drop for model 1
    if (document.getElementById('drop-zone-1') && model1FileInput) {
        setupDragAndDrop(
            document.getElementById('drop-zone-1'),
            model1FileInput,
            async (file) => {
                try {
                    console.log('Loading model 1:', file.name);
                    const arrayBuffer = await readFileAsArrayBuffer(file);
                    const success = await modelViewer1.loadModel(arrayBuffer, file.name);
                    
                    if (success) {
                        displayModelStats('model1-stats', modelViewer1.getModelStats());
                        updateCompareButton();
                    }
                } catch (error) {
                    console.error('Error loading model 1:', error);
                    alert('Error loading model: ' + error.message);
                }
            }
        );
    }
    
    // Setup drag and drop for model 2
    if (document.getElementById('drop-zone-2') && model2FileInput) {
        setupDragAndDrop(
            document.getElementById('drop-zone-2'),
            model2FileInput,
            async (file) => {
                try {
                    console.log('Loading model 2:', file.name);
                    const arrayBuffer = await readFileAsArrayBuffer(file);
                    const success = await modelViewer2.loadModel(arrayBuffer, file.name);
                    
                    if (success) {
                        displayModelStats('model2-stats', modelViewer2.getModelStats());
                        updateCompareButton();
                    }
                } catch (error) {
                    console.error('Error loading model 2:', error);
                    alert('Error loading model: ' + error.message);
                }
            }
        );
    }
    
    // Setup event listeners
    
    // Threshold slider
    if (thresholdSlider && thresholdValue) {
        thresholdSlider.addEventListener('input', () => {
            thresholdValue.textContent = thresholdSlider.value;
        });
    }
    
    // Auto-rotate checkbox
    if (autoRotateCheckbox) {
        autoRotateCheckbox.addEventListener('change', () => {
            const autoRotate = autoRotateCheckbox.checked;
            modelViewer1.setAutoRotate(autoRotate);
            modelViewer2.setAutoRotate(autoRotate);
        });
    }
    
    // Compare button
    if (compareBtn) {
        compareBtn.addEventListener('click', async () => {
            try {
                // Disable the button during comparison
                compareBtn.disabled = true;
                compareBtn.textContent = 'Comparing...';
                
                console.log('Starting comparison...');
                
                // Run comparison with current threshold
                await modelComparator.compareModels(
                    modelViewer1,
                    modelViewer2,
                    thresholdSlider ? parseFloat(thresholdSlider.value) : 0.1
                );
                
                // Enable save button if available
                if (saveComparisonBtn) {
                    saveComparisonBtn.disabled = false;
                }
                
                console.log('Comparison complete');
                
            } catch (error) {
                console.error('Error during comparison:', error);
                alert('Error comparing models: ' + error.message);
            } finally {
                // Re-enable the button
                compareBtn.disabled = false;
                compareBtn.textContent = 'Compare Models';
            }
        });
    }
    
    // Save comparison button
    if (saveComparisonBtn) {
        saveComparisonBtn.addEventListener('click', () => {
            try {
                modelComparator.downloadReport();
            } catch (error) {
                console.error('Error saving comparison:', error);
                alert('Error saving comparison: ' + error.message);
            }
        });
    }
    
    /**
     * Update compare button state based on model availability
     */
    function updateCompareButton() {
        if (compareBtn) {
            const canCompare = modelViewer1.hasModel() && modelViewer2.hasModel();
            compareBtn.disabled = !canCompare;
            
            // Log current state
            console.log('Compare button state updated:', canCompare ? 'enabled' : 'disabled');
        }
    }
    
    // Set initial UI state
    updateCompareButton();
    if (saveComparisonBtn) {
        saveComparisonBtn.disabled = true;
    }
    
    // Log initialization complete
    console.log('GLB Model Comparison Tool initialized');
});