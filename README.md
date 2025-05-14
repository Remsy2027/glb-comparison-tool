# GLB Comparison Tool

A modern, professional 3D model comparison tool built with React and Three.js that allows you to compare GLB models with pixel-perfect accuracy and material fidelity analysis.

## 🚀 Features

- **Real-time Camera Synchronization** - Both models automatically sync when you zoom, pan, or rotate
- **Pixel-by-Pixel Comparison** - Advanced image comparison with difference visualization
- **Texture Analysis** - Detailed texture information and material statistics
- **Professional Reports** - Generate downloadable HTML reports with comparison results
- **Modern UI/UX** - Clean, responsive design with smooth animations
- **Drag & Drop Support** - Easy file upload with visual feedback

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Remsy2027/glb-comparison-tool.git
   cd glb-comparison-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎯 How to Use

### Step 1: Load Models

1. **Model 1**: Click on the left upload area or drag a GLB file
2. **Model 2**: Click on the right upload area or drag a GLB file

**Model Location**: Sample GLB models are stored in the `Steps > Step-2` folder.

### Step 2: Navigate the Models

- **Zoom**: Mouse wheel or pinch gesture
- **Rotate**: Left-click and drag
- **Pan**: Right-click and drag (or two-finger drag on mobile)

**Note**: Both cameras automatically synchronize - move either model and the other follows instantly!

### Step 3: Reset Camera Position (Optional)

Click the **"Reset Cameras"** button to return both models to the standardized front view.

### Step 4: Compare Models

1. Navigate to your desired viewing angle (both models will move together)
2. Click **"Compare Models"**
3. Wait for the analysis to complete

### Step 5: View Results

The comparison will show:
- **Model 1** snapshot
- **Model 2** snapshot  
- **Difference Visualization** (red areas show differences)
- **Percentage Difference** score
- **Quality Assessment** (Excellent/Good/Moderate/Significant)

### Step 6: Download Report

Click **"Download Report"** to generate a professional HTML report containing:
- Visual comparison images
- Detailed model statistics
- Texture analysis
- Comparison results
- Timestamp and metadata

## 📊 Model Statistics

For each loaded model, you'll see:
- **File Size** - Total GLB file size
- **Vertices** - Number of vertices in the geometry
- **Triangles** - Number of triangular faces
- **Materials** - Count of unique materials
- **Textures** - Number and names of textures used
- **Texture Details** - List of all textures with their types (Diffuse, Normal, etc.)

## 🔍 Comparison Analysis

The tool uses advanced pixel-by-pixel comparison to detect:
- Material differences
- Geometry variations
- Texture mapping changes
- Lighting inconsistencies
- Overall visual fidelity

### Accuracy Levels:
- **< 1%** - Excellent (Visually identical)
- **1-5%** - Good (Minor variations)
- **5-15%** - Moderate (Noticeable differences)
- **> 15%** - Significant (Major variations)

## 🛠️ Technical Details

### Built With:
- **React** - Component-based UI framework
- **Three.js** - 3D graphics rendering
- **Vite** - Fast build tool and dev server
- **OrbitControls** - Camera navigation
- **HDR Environment** - Realistic lighting

### Key Features:
- **DRACO Compression** - Support for compressed GLB files
- **HDR Lighting** - Neutral HDR environment for consistent rendering
- **PBR Materials** - Physically-based rendering for accurate materials
- **Real-time Sync** - 60fps camera synchronization between models

## 📁 Project Structure

```
glb-comparison-tool/
├── public/
│   └── index.html
├── src/
│   ├── components/          # React UI components
│   ├── services/           # Business logic and utilities
│   ├── utils/              # Helper functions
│   ├── App.jsx             # Main application
│   └── App.css             # Global styles
├── Steps/
│   └── Step-2/             # Sample GLB models
├── package.json
├── vite.config.js
└── README.md
```

## 🔄 Camera Synchronization

The tool features automatic camera synchronization:

1. **Load both models** - Cameras are automatically linked
2. **Navigate either model** - The other follows in real-time
3. **All movements sync**:
   - Zoom (mouse wheel)
   - Rotation (left-click drag)
   - Pan (right-click drag)
4. **Perfect alignment** - Ensures accurate comparisons

## 📝 Tips for Best Results

1. **Use similar models** - Best comparisons come from related GLB files
2. **Check texture details** - Review the texture analysis for material differences
3. **Reset before comparing** - Use "Reset Cameras" for standardized comparison
4. **Navigate freely** - Both cameras move together, so find the best angle
5. **Download reports** - Save results for future reference

## 🐛 Troubleshooting

### Models not loading?
- Ensure files are valid GLB format
- Check file size (very large files may take longer)
- Refresh the page and try again

### Camera not syncing?
- Both models must be loaded for sync to work
- Try clicking "Reset Cameras" to resync

### Comparison seems inaccurate?
- Ensure both cameras are at the same angle (they sync automatically)
- Check that models are properly centered
- Use "Reset Cameras" before comparing

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Happy Comparing!** 🎨✨