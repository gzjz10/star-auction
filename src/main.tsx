import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display/latin-800';
import '@fontsource/big-shoulders-display/latin-900';
import '@fontsource/lalezar/arabic-400.css';
import '@fontsource/alfa-slab-one/latin-400.css';
import '@fontsource/rakkas/arabic-400.css';
import '@fontsource/changa/arabic-400.css';
import '@fontsource/changa/arabic-600.css';
import '@fontsource/changa/arabic-700.css';
import '@fontsource/changa/latin-400.css';
import '@fontsource/changa/latin-600.css';
import '@fontsource/changa/latin-700.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
