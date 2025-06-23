import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Play, Folder, Heart, Trash2 } from 'lucide-react';
import { LibraryGame } from '../../shared/types';
import { GameCard } from './GameCard';
import { AddGameModal } from './AddGameModal';

export function LibraryView() {
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<LibraryGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'favorites'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, searchQuery, filter]);

  const loadLibrary = async () => {
    try {
      const libraryGames = await window.f95Api.library.getAll();
      setGames(libraryGames);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGames = () => {
    let filtered = games;

    if (filter === 'installed') {
      filtered = filtered.filter(game => game.installed);
    } else if (filter === 'favorites') {
      filtered = filtered.filter(game => game.favorite);
    }

    if (searchQuery) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.developer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredGames(filtered);
  };

  const handleLaunchGame = async (gameId: number) => {
    try {
      await window.f95Api.launcher.launch(gameId);
      // Refresh library to update last played time
      loadLibrary();
    } catch (error) {
      console.error('Failed to launch game:', error);
      alert('Failed to launch game. Make sure it is properly installed.');
    }
  };

  const handleToggleFavorite = async (gameId: number) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      try {
        await window.f95Api.library.update(gameId, { favorite: !game.favorite });
        loadLibrary();
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
      }
    }
  };

  const handleRemoveGame = async (gameId: number) => {
    if (confirm('Are you sure you want to remove this game from your library?')) {
      try {
        await window.f95Api.library.remove(gameId);
        loadLibrary();
      } catch (error) {
        console.error('Failed to remove game:', error);
      }
    }
  };

  const handleOpenFolder = async (gameId: number) => {
    try {
      await window.f95Api.launcher.openFolder(gameId);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleSync = () => {
    // Reload library after sync to show updated metadata
    loadLibrary();
  };

  const handleAddGame = () => {
    loadLibrary();
    setShowAddModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-400">Loading library...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Game Library</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Game</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Games</option>
              <option value="installed">Installed</option>
              <option value="favorites">Favorites</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredGames.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-xl font-semibold mb-2">No games found</h2>
            <p>Start by adding some games to your library</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onLaunch={() => handleLaunchGame(game.id)}
                onToggleFavorite={() => handleToggleFavorite(game.id)}
                onRemove={() => handleRemoveGame(game.id)}
                onOpenFolder={() => handleOpenFolder(game.id)}
                onSync={handleSync}
                showLibraryActions={true}
              />
            ))}
          </div>
        )}
      </div>

      <AddGameModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddGame}
      />
    </div>
  );
}