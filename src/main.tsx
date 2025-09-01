import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './src/context/ThemeContext.tsx'; // YENİ: Import et

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <ThemeProvider>
    <App />
     </ThemeProvider>
  </StrictMode>
);
