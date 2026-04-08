import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; background:#0a0a0a; color:white; font-family:sans-serif;">Štartujem Alcatraz...</div>';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
