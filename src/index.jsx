import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Import Three.js
import * as THREE from 'three';

// Make THREE available globally
window.THREE = THREE;

// Load the pixelmatch utility if needed
import './utils/pixelmatch.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);