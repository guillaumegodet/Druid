import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initKeycloak } from './lib/auth';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

initKeycloak(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});