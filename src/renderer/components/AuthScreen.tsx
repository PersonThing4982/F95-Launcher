import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: () => void;
  onOfflineMode: () => void;
}

export function AuthScreen({ onLoginSuccess, onOfflineMode }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  React.useEffect(() => {
    window.f95Api.auth.on2FARequest(() => {
      setShow2FA(true);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await window.f95Api.auth.login(username, password);
      
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = () => {
    if (twoFACode.trim()) {
      window.f95Api.auth.send2FACode(twoFACode);
      setShow2FA(false);
      setTwoFACode('');
    }
  };

  if (show2FA) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Two-Factor Authentication</h2>
          <p className="text-gray-300 text-center mb-4">
            Please enter the 2FA code from your authenticator app
          </p>
          <div className="mb-4">
            <input
              type="text"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              placeholder="123456"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-center text-xl tracking-widest"
              maxLength={6}
            />
          </div>
          <button
            onClick={handle2FASubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <LogIn className="mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold">F95 Game Launcher</h1>
          <p className="text-gray-300 mt-2">Sign in to your F95Zone account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <button
              onClick={onOfflineMode}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition duration-200"
            >
              Continue Offline (Local Games Only)
            </button>
          </div>
          <div className="text-center text-sm text-gray-400">
            <p>Need an account? Visit F95Zone to register</p>
            <p className="text-xs mt-1">Offline mode: Play local games without F95Zone features</p>
          </div>
        </div>
      </div>
    </div>
  );
}