import React, { useState } from 'react';
import { Trash2, Info } from 'lucide-react';

export function SettingsView() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the cache?')) {
      setIsClearing(true);
      try {
        await window.f95Api.settings.clearCache();
        alert('Cache cleared successfully!');
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Failed to clear cache');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleOpenAppVersion = async () => {
    try {
      const version = await window.f95Api.system.getVersion();
      alert(`F95 Game Launcher v${version}`);
    } catch (error) {
      alert('Unable to get version information');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Application Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Application Information</h2>

            <div className="space-y-4">
              <button
                onClick={handleOpenAppVersion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Info size={20} />
                <span>About F95 Game Launcher</span>
              </button>

              <div className="text-sm text-gray-400">
                <p>F95 Game Launcher - Local game management and F95Zone integration</p>
                <p className="mt-2">Features:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Local game library management</li>
                  <li>F95Zone metadata syncing (when signed in)</li>
                  <li>Game discovery and search</li>
                  <li>Offline mode for local games</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Maintenance</h2>

            <div className="space-y-4">
              <button
                onClick={handleClearCache}
                disabled={isClearing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Trash2 size={20} />
                <span>{isClearing ? 'Clearing...' : 'Clear F95Zone Cache'}</span>
              </button>

              <p className="text-sm text-gray-400">
                Clear cached game metadata from F95Zone. This will force fresh downloads of game
                information on next sync.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
