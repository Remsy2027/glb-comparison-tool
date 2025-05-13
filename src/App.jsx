import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ModelUploader from './components/ModelUploader';
import ModelViewer from './components/ModelViewer';
import ModelStats from './components/ModelStats';
import ComparisonResults from './components/ComparisonResults';
import LoadingOverlay from './components/LoadingOverlay';
import ActionButtons from './components/ActionButtons';
import ErrorBoundary from './components/ErrorBoundary';
import { ThreeService } from './services/ThreeService';
import { ComparisonService } from './services/ComparisonService';
import { ReportService } from './services/ReportService';

function App() {
  const [originalFile, setOriginalFile] = useState(null);
  const [comparisonFile, setComparisonFile] = useState(null);
  const [originalStats, setOriginalStats] = useState(null);
  const [comparisonStats, setComparisonStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [comparisonResults, setComparisonResults] = useState(null);
  const [originalScene, setOriginalScene] = useState(null);
  const [comparisonScene, setComparisonScene] = useState(null);

  const originalCanvasRef = useRef();
  const comparisonCanvasRef = useRef();
  const originalViewerRef = useRef();
  const comparisonViewerRef = useRef();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await ThreeService.initialize();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  const handleFileUpload = async (file, type) => {
    setIsLoading(true);
    setLoadingMessage(`Loading ${type} model...`);

    try {
      const { scene, stats } = await ThreeService.loadModel(file);

      if (type === 'original') {
        setOriginalFile(file);
        setOriginalStats(stats);
        setOriginalScene(scene);
      } else {
        setComparisonFile(file);
        setComparisonStats(stats);
        setComparisonScene(scene);
      }
    } catch (error) {
      console.error(`Error loading ${type} model:`, error);
      alert(`Error loading ${type} model: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCompare = async () => {
    if (!originalScene || !comparisonScene) {
      alert('Please load both models before comparing');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Comparing models...');

    try {
      const results = await ComparisonService.compareModels(
        originalViewerRef.current,
        comparisonViewerRef.current
      );
      setComparisonResults(results);
    } catch (error) {
      console.error('Error comparing models:', error);
      alert('Error comparing models: ' + error.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDownloadReport = () => {
    if (!comparisonResults) {
      alert('Please compare models first');
      return;
    }

    ReportService.generateReport({
      originalStats,
      comparisonStats,
      comparisonResults,
    });
  };

  const canCompare =
    originalFile && comparisonFile && originalScene && comparisonScene;

  return (
    <ErrorBoundary>
      <div className="app">
        <Header />

        <div className="container">
          <div className="upload-section">
            <div className="model-card">
              <ModelUploader
                label="Original Model"
                onFileSelect={(file) => handleFileUpload(file, 'original')}
                file={originalFile}
              />
              {originalFile && (
                <ModelViewer
                  ref={originalViewerRef}
                  canvasRef={originalCanvasRef}
                  scene={originalScene}
                  type="original"
                />
              )}
              {originalStats && <ModelStats stats={originalStats} />}
            </div>

            <div className="model-card">
              <ModelUploader
                label="Comparison Model"
                onFileSelect={(file) => handleFileUpload(file, 'comparison')}
                file={comparisonFile}
              />
              {comparisonFile && (
                <ModelViewer
                  ref={comparisonViewerRef}
                  canvasRef={comparisonCanvasRef}
                  scene={comparisonScene}
                  type="comparison"
                />
              )}
              {comparisonStats && <ModelStats stats={comparisonStats} />}
            </div>
          </div>

          <ActionButtons
            canCompare={canCompare}
            onCompare={handleCompare}
            canDownload={!!comparisonResults}
            onDownload={handleDownloadReport}
          />

          {comparisonResults && (
            <ComparisonResults results={comparisonResults} />
          )}
        </div>

        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </div>
    </ErrorBoundary>
  );
}

export default App;