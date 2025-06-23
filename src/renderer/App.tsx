import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { MainScreen } from './components/MainScreen';
import { TitleBar } from './components/TitleBar';
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
    <div className="min-h-screen bg-gray-900 text-white">
      <TitleBar />
      <div className="flex flex-col">
        {isAuthenticated || isOfflineMode ? (
          <MainScreen onLogout={handleLogout} isOfflineMode={isOfflineMode} />
        ) : (
          <AuthScreen onLoginSuccess={handleLoginSuccess} onOfflineMode={handleOfflineMode} />
        )}
      </div>
    </div>
  );
}

export default App;