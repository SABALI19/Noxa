import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Get the DOM element
const container = document.getElementById('root');

// Check if element exists
if (!container) {
  throw new Error('Root element not found. Check your index.html');
}

// Create React root
const root = createRoot(container);

// Render the app
root.render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);