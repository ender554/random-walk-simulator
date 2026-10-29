import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './base.css';

// Every page entry calls this with its top-level element.
export function mount(page) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {page}
    </StrictMode>,
  );
}
