// pixelmatch.js - Pixel comparison utility

// Inline pixelmatch implementation for reliability
window.pixelmatch = function(img1, img2, output, width, height, options) {
    options = options || {};
    const threshold = options.threshold === undefined ? 0.1 : options.threshold;
    const includeAA = !!options.includeAA;
    const alpha = options.alpha === undefined ? 0.1 : options.alpha;
    const diffColor = options.diffColor || [255, 0, 0];
    let count = 0;
    
    // Compare each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Get RGB values (ignore alpha)
        const r1 = img1[i];
        const g1 = img1[i + 1];
        const b1 = img1[i + 2];
        
        const r2 = img2[i];
        const g2 = img2[i + 1];
        const b2 = img2[i + 2];
        
        // Calculate perceptual color difference using weighted RGB
        const deltaR = r1 - r2;
        const deltaG = g1 - g2;
        const deltaB = b1 - b2;
        
        // Use weighted RGB formula for better perceptual accuracy
        const diff = Math.sqrt(
          0.299 * deltaR * deltaR +
          0.587 * deltaG * deltaG +
          0.114 * deltaB * deltaB
        ) / 255;
        
        if (diff > threshold) {
          // Mark as different
          output[i] = diffColor[0];
          output[i + 1] = diffColor[1];
          output[i + 2] = diffColor[2];
          output[i + 3] = 255;
          count++;
        } else {
          // Use a mix of the original pixel and white (based on alpha)
          output[i] = 255 * (1 - alpha) + r1 * alpha;
          output[i + 1] = 255 * (1 - alpha) + g1 * alpha;
          output[i + 2] = 255 * (1 - alpha) + b1 * alpha;
          output[i + 3] = 255;
        }
      }
    }
    
    return count;
  };