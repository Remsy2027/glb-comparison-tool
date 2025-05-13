export class ComparisonService {
    static async compareModels(originalViewer, comparisonViewer) {
      if (!originalViewer || !comparisonViewer) {
        throw new Error('Both viewers must be available for comparison');
      }
  
      const originalRenderer = originalViewer.getRenderer();
      const comparisonRenderer = comparisonViewer.getRenderer();
      const originalCamera = originalViewer.getCamera();
      const comparisonCamera = comparisonViewer.getCamera();
      const originalControls = originalViewer.getControls();
      const comparisonControls = comparisonViewer.getControls();
  
      // Synchronize camera positions
      comparisonCamera.position.copy(originalCamera.position);
      comparisonCamera.quaternion.copy(originalCamera.quaternion);
  
      // Disable controls temporarily
      if (originalControls) originalControls.enabled = false;
      if (comparisonControls) comparisonControls.enabled = false;
  
      // Wait for renders to complete
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
  
      // Capture snapshots
      const originalImage = originalRenderer.domElement.toDataURL('image/png');
      const comparisonImage = comparisonRenderer.domElement.toDataURL('image/png');
  
      // Re-enable controls
      if (originalControls) originalControls.enabled = true;
      if (comparisonControls) comparisonControls.enabled = true;
  
      // Process comparison
      const results = await this.processImageComparison(originalImage, comparisonImage);
  
      return {
        originalImage,
        comparisonImage,
        diffImage: results.diffImage,
        percentage: results.percentage,
        mismatchedPixels: results.mismatchedPixels
      };
    }
  
    static async processImageComparison(img1DataURL, img2DataURL) {
      const img1 = await this.loadImage(img1DataURL);
      const img2 = await this.loadImage(img2DataURL);
  
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      const diffCanvas = document.createElement('canvas');
  
      const width = img1.width;
      const height = img1.height;
  
      canvas1.width = canvas2.width = diffCanvas.width = width;
      canvas1.height = canvas2.height = diffCanvas.height = height;
  
      const ctx1 = canvas1.getContext('2d');
      const ctx2 = canvas2.getContext('2d');
      const ctxDiff = diffCanvas.getContext('2d');
  
      ctx1.drawImage(img1, 0, 0);
      ctx2.drawImage(img2, 0, 0);
  
      const imageData1 = ctx1.getImageData(0, 0, width, height);
      const imageData2 = ctx2.getImageData(0, 0, width, height);
      const diffData = ctxDiff.createImageData(width, height);
  
      // Perform pixel comparison
      let mismatchedPixels;
      if (typeof window.pixelmatch === 'function') {
        mismatchedPixels = window.pixelmatch(
          imageData1.data,
          imageData2.data,
          diffData.data,
          width,
          height,
          {
            threshold: 0.05,
            includeAA: false,
            alpha: 0.1,
            diffColor: [255, 0, 0]
          }
        );
      } else {
        mismatchedPixels = this.simplePixelMatch(
          imageData1.data,
          imageData2.data,
          diffData.data,
          width,
          height,
          { threshold: 0.05 }
        );
      }
  
      ctxDiff.putImageData(diffData, 0, 0);
      const diffImage = diffCanvas.toDataURL('image/png');
  
      const percentage = (mismatchedPixels / (width * height)) * 100;
  
      return {
        diffImage,
        percentage,
        mismatchedPixels
      };
    }
  
    static simplePixelMatch(img1, img2, output, width, height, options) {
      const threshold = options?.threshold || 0.1;
      let differentPixels = 0;
  
      for (let i = 0; i < img1.length; i += 4) {
        const r1 = img1[i];
        const g1 = img1[i + 1];
        const b1 = img1[i + 2];
  
        const r2 = img2[i];
        const g2 = img2[i + 1];
        const b2 = img2[i + 2];
  
        const colorDiff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        const normalizedDiff = colorDiff / 765;
  
        if (normalizedDiff > threshold) {
          output[i] = 255;     // R
          output[i + 1] = 0;   // G
          output[i + 2] = 0;   // B
          output[i + 3] = 255; // A
          differentPixels++;
        } else {
          output[i] = r1;
          output[i + 1] = g1;
          output[i + 2] = b1;
          output[i + 3] = 255;
        }
      }
  
      return differentPixels;
    }
  
    static loadImage(dataURL) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataURL;
      });
    }
  }