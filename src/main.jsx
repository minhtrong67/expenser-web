import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Returning users: start downloading the signed-in shell and the current page
// right now, in parallel with Firebase Auth restoring the session - so by the
// time the user is known there is nothing left to wait for.
try {
  if (localStorage.getItem('qlct:session') === '1') {
    const pages = {
      '/': () => import('./pages/Dashboard'),
      '/transactions': () => import('./pages/Transactions'),
      '/categories': () => import('./pages/Categories'),
      '/wallets': () => import('./pages/Wallets'),
      '/statistics': () => import('./pages/Statistics'),
      '/settings': () => import('./pages/Settings'),
    };
    import('./routes/ProtectedShell');
    (pages[window.location.pathname] || pages['/'])();
  }
} catch {
  /* best-effort optimisation */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
