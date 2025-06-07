/**
 * @file Entry point for the Numeria's Edge React application.
 * This file handles the initialization of the React application and mounts the main <App /> component
 * into the DOM element with the ID 'root'. It uses React 18's createRoot API for concurrent rendering.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Get the root DOM element where the React app will be mounted.
const rootElement = document.getElementById('root');

// Ensure the root element exists before attempting to render.
if (!rootElement) {
  throw new Error("Fatal Error: Could not find the root HTML element (ID 'root') to mount the React application. Please ensure your index.html contains an element with this ID.");
}

// Create a React root for the application.
const root = ReactDOM.createRoot(rootElement);

// Render the main App component within React's StrictMode.
// StrictMode helps with identifying potential problems in an application by activating additional checks and warnings.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
