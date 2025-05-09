@echo off
echo GLB Model Comparison Tool - Setup Script
echo ======================================
echo.

echo Creating directory structure...
mkdir assets 2>nul
mkdir assets\css 2>nul
mkdir js 2>nul
mkdir js\utils 2>nul
mkdir scripts 2>nul

echo.
echo Downloading HDR environment map from Three.js examples...
powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr' -OutFile 'assets/environment.hdr'}"

echo.
echo Setting up application...
echo You'll need to place the following files in their respective directories:

echo.
echo - HTML: improved-index.html → index.html
echo - CSS: improved-styles.css → assets/css/styles.css
echo - JavaScript:
echo   - fixed-main.js → js/main.js
echo   - ModelViewer.js → js/ModelViewer.js
echo   - ModelComparator.js → js/ModelComparator.js
echo   - dragAndDrop.js → js/utils/dragAndDrop.js
echo   - fileUtils.js → js/utils/fileUtils.js
echo   - uiUtils.js → js/utils/uiUtils.js
echo - Scripts:
echo   - compare-models.js → scripts/compare-models.js
echo   - batch-process.js → scripts/batch-process.js

echo.
echo To start the application, either:
echo 1. Open index.html directly in your browser
echo 2. Use a local web server:
echo    - Install Node.js if needed
echo    - Run: npx http-server
echo    - Open: http://localhost:8080

echo.
echo For command-line tools:
echo - Install Node.js
echo - Run: npm install puppeteer pngjs pixelmatch

echo.
echo Setup completed!
echo.
pause