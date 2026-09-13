import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/data-tools.css';
import './styles/polish.css';
import './styles/data-safety.css';
import './styles/debts.css';

if (navigator.storage?.persist) {
  void navigator.storage.persist().catch(() => false);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
