import React, { useState } from 'react';
import { Folder, X } from 'lucide-react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (gameData: any) => void;
}

export function AddGameModal({ isOpen, onClose, onAdd }: AddGameModalProps) {
  const [gamePath, setGamePath] = useState('');
  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [version, setVersion] = useState('');
  const [f95Url, setF95Url] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const directory = await window.f95Api.settings.selectDirectory();
      if (directory) {
        setGamePath(directory);
        // Auto-fill name from folder name if not set
        if (!name) {
          const folderName = directory.split('/').pop() || '';
          setName(folderName);
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamePath || !name) return;

    setIsLoading(true);
    try {
      const gameData = {
        name: name.trim(),
        developer: developer.trim() || 'Unknown',
        version: version.trim() || '1.0.0',
        f95Url: f95Url.trim(),
        description: description.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        engine: { name: 'Unknown' },
      };

      await window.f95Api.library.addManual(gamePath, gameData);

      // If F95 URL is provided, try to sync metadata
      if (f95Url.trim()) {
        try {
          const games = await window.f95Api.library.getAll();
          const addedGame = games.find((g: any) => g.installPath === gamePath);
          if (addedGame) {
            await window.f95Api.library.syncMetadata(addedGame.id);
          }
        } catch (syncError) {
          console.warn('Failed to sync metadata:', syncError);
        }
      }

      onAdd(gameData);
      handleClose();
    } catch (error) {
      console.error('Failed to add game:', error);
      alert('Failed to add game. Please check the path and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGamePath('');
    setName('');
    setDeveloper('');
    setVersion('');
    setF95Url('');
    setDescription('');
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Game Manually</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Game Folder *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={gamePath}
                onChange={(e) => setGamePath(e.target.value)}
                placeholder="/path/to/game/folder"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center"
              >
                <Folder size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Game Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter game name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Developer</label>
            <input
              type="text"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="Developer name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              F95Zone URL (Optional)
            </label>
            <input
              type="text"
              value={f95Url}
              onChange={(e) => setF95Url(e.target.value)}
              placeholder="https://f95zone.to/threads/..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              If provided, metadata will be automatically synced from F95Zone
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="romance, adventure, 3dcg"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Game description..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={!gamePath || !name || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              {isLoading ? 'Adding...' : 'Add Game'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
