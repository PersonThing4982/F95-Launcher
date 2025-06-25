import React, { useState, useEffect } from 'react';
import {
  Play,
  Heart,
  Folder,
  Trash2,
  Download,
  Clock,
  Star,
  Link,
  RefreshCw,
  Settings,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { LibraryGame } from '../../shared/types';

interface GameCardProps {
  game: LibraryGame;
  onLaunch: () => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
  onOpenFolder: () => void;
  onAdd?: () => void;
  onSync?: () => void;
  showLibraryActions?: boolean;
}

export function GameCard({
  game,
  onLaunch,
  onToggleFavorite,
  onRemove,
  onOpenFolder,
  onAdd,
  onSync,
  showLibraryActions = true,
}: GameCardProps) {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [f95Url, setF95Url] = useState(game.threadUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  useEffect(() => {
    // Check for updates if game has F95 thread URL and is in library
    if (game.threadUrl && showLibraryActions) {
      checkForUpdates();
    }
  }, [game.threadUrl, showLibraryActions]);

  const checkForUpdates = async () => {
    try {
      const update = await window.f95Api.updates.checkGame(game.id);
      if (update) {
        setHasUpdate(true);
        setUpdateInfo(update);
      }
    } catch (error) {
      // Silently handle errors - don't show update status if we can't check
    }
  };

  const formatPlayTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleLinkF95 = async () => {
    if (!f95Url.trim()) return;

    try {
      await window.f95Api.library.linkF95(game.id, f95Url);
      setShowSyncModal(false);
      alert('F95 link added successfully!');
    } catch (error) {
      console.error('Failed to link F95 URL:', error);
      alert('Failed to link F95 URL. Please check the URL format.');
    }
  };

  const handleSyncMetadata = async () => {
    if (!game.threadUrl) {
      setShowSyncModal(true);
      return;
    }

    setIsSyncing(true);
    try {
      await window.f95Api.library.syncMetadata(game.id);
      onSync?.();
      alert('Game metadata synced successfully!');
    } catch (error) {
      console.error('Failed to sync metadata:', error);
      alert('Failed to sync metadata. Please check your connection and F95 link.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="game-card bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col h-full min-h-[400px]">
      <div className="relative">
        {game.cover ? (
          <img
            src={game.cover}
            alt={game.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Fallback to preview images if cover fails
              if (game.previewImages && game.previewImages.length > 0) {
                e.currentTarget.src = game.previewImages[0];
              }
            }}
          />
        ) : game.previewImages && game.previewImages.length > 0 ? (
          <img src={game.previewImages[0]} alt={game.name} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <div className="text-6xl">🎮</div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex space-x-1">
          {hasUpdate && (
            <div
              className="bg-yellow-500 rounded-full p-1"
              title={`Update available: ${updateInfo?.newVersion || 'New version'}`}
            >
              <AlertCircle size={12} fill="white" />
            </div>
          )}
          {game.favorite && (
            <div className="bg-red-500 rounded-full p-1">
              <Heart size={12} fill="white" />
            </div>
          )}
          {game.installed && (
            <div className="bg-green-500 rounded-full p-1">
              <Play size={12} fill="white" />
            </div>
          )}
          {game.mod && (
            <div className="bg-purple-500 rounded-full p-1" title="Mod">
              <Settings size={12} fill="white" />
            </div>
          )}
          {game.censored === false && (
            <div className="bg-orange-500 rounded-full p-1" title="Uncensored">
              <span className="text-white text-xs font-bold">18+</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Star size={14} className="text-yellow-400" />
              <span className="text-sm">{game.rating.toFixed(1)}</span>
            </div>
            <div className="text-sm opacity-75">{game.version}</div>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{game.name}</h3>
            <p className="text-gray-400 text-sm truncate">{game.developer}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          {game.engine && <div className="text-xs text-blue-400">{game.engine.name}</div>}
          {game.os && game.os.length > 0 && (
            <div className="flex items-center space-x-1">
              <Monitor size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                {game.os.includes('win') && '🪟'}
                {game.os.includes('mac') && '🍎'}
                {game.os.includes('linux') && '🐧'}
              </span>
            </div>
          )}
        </div>

        {/* Status and Category */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              game.status === 'Completed'
                ? 'bg-green-600 text-white'
                : game.status === 'Ongoing'
                  ? 'bg-blue-600 text-white'
                  : game.status === 'Abandoned'
                    ? 'bg-red-600 text-white'
                    : game.status === 'Onhold'
                      ? 'bg-yellow-600 text-black'
                      : 'bg-gray-600 text-gray-300'
            }`}
          >
            {game.status}
          </span>
          {game.category && <span className="text-xs text-gray-400">{game.category}</span>}
        </div>

        {/* Genre tags */}
        {game.genre && game.genre.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {game.genre.slice(0, 2).map((genre, index) => (
              <span key={index} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                {genre}
              </span>
            ))}
            {game.genre.length > 2 && (
              <span className="text-xs text-purple-400">+{game.genre.length - 2}</span>
            )}
          </div>
        )}

        {/* Regular tags - limit to prevent overflow */}
        <div className="flex flex-wrap gap-1 mb-2 min-h-[20px]">
          {game.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {game.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{game.tags.length - 2}</span>
          )}
        </div>

        {/* F95Zone link - always visible if available */}
        {game.threadUrl && (
          <div className="mb-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.f95Api.system.openExternal(game.threadUrl!);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              View on F95Zone
            </button>
          </div>
        )}

        {game.lastPlayed && (
          <div className="flex items-center text-xs text-gray-400 mb-2">
            <Clock size={12} className="mr-1" />
            <span>Last played: {formatDate(game.lastPlayed)}</span>
            {game.playTime && game.playTime > 0 && (
              <span className="ml-2">({formatPlayTime(game.playTime)})</span>
            )}
          </div>
        )}

        {/* Action buttons - always at bottom */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {game.installed ? (
            <button
              onClick={onLaunch}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <Play size={14} />
              <span>Play</span>
            </button>
          ) : onAdd ? (
            <button
              onClick={onAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <Download size={14} />
              <span>Add to Library</span>
            </button>
          ) : (
            <div className="bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm">Not Installed</div>
          )}

          <div className="flex space-x-1">
            {showLibraryActions && (
              <>
                <button
                  onClick={onToggleFavorite}
                  className={`p-1 rounded ${
                    game.favorite
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart size={16} fill={game.favorite ? 'currentColor' : 'none'} />
                </button>

                <button
                  onClick={handleSyncMetadata}
                  disabled={isSyncing}
                  className={`p-1 rounded ${
                    game.threadUrl
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-yellow-400 hover:text-yellow-300'
                  }`}
                  title={game.threadUrl ? 'Sync metadata' : 'Add F95 link'}
                >
                  {isSyncing ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : game.threadUrl ? (
                    <RefreshCw size={16} />
                  ) : (
                    <Link size={16} />
                  )}
                </button>

                {game.installed && (
                  <button
                    onClick={onOpenFolder}
                    className="text-gray-400 hover:text-white p-1 rounded"
                  >
                    <Folder size={16} />
                  </button>
                )}

                <button onClick={onRemove} className="text-gray-400 hover:text-red-400 p-1 rounded">
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Link F95 Thread</h3>
            <p className="text-gray-300 text-sm mb-4">
              Enter the F95Zone thread URL to sync metadata for this game:
            </p>
            <input
              type="text"
              value={f95Url}
              onChange={(e) => setF95Url(e.target.value)}
              placeholder="https://f95zone.to/threads/..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleLinkF95}
                disabled={!f95Url.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Link & Sync
              </button>
              <button
                onClick={() => setShowSyncModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
