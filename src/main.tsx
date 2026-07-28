import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LoginGate } from './components/auth/LoginGate';
import './index.css';

console.log('🚀 AI Office is starting...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <LoginGate>
            <App />
          </LoginGate>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);

console.log('✓ App mounted to DOM');
