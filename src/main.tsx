import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline capability & automatic background updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version available.');
  },
  onOfflineReady() {
    console.log('[PWA] App is ready for offline operation.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

