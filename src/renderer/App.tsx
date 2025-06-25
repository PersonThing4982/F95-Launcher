import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { MainScreen } from './components/MainScreen';
import { TitleBar } from './components/TitleBar';
import ErrorBoundary from './components/ErrorBoundary';
import { F95Api } from '../main/preload';

declare global {
  interface Window {
    f95Api: F95Api;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await window.f95Api.auth.checkStatus();
      setIsAuthenticated(result.authenticated);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsOfflineMode(false);
  };

  const handleOfflineMode = () => {
    setIsOfflineMode(true);
    setIsAuthenticated(false);
  };

  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        await window.f95Api.auth.logout();
      }
      setIsAuthenticated(false);
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // Could send to crash reporting service here
      }}
    >
      <div className="min-h-screen bg-gray-900 text-white">
        <ErrorBoundary isolate>
          <TitleBar />
        </ErrorBoundary>
        <div className="flex flex-col">
          {isAuthenticated || isOfflineMode ? (
            <ErrorBoundary isolate>
              <MainScreen onLogout={handleLogout} isOfflineMode={isOfflineMode} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary isolate>
              <AuthScreen onLoginSuccess={handleLoginSuccess} onOfflineMode={handleOfflineMode} />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
