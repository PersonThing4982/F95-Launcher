import React, { useState } from 'react';
import { Search, Filter, TrendingUp, Clock, Folder, X, ChevronDown } from 'lucide-react';
import { GameInfo, SearchFilters } from '../../shared/types';
import { GameCard } from './GameCard';

export function SearchView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'search' | 'trending' | 'latest'>('search');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null);
  const [gamePath, setGamePath] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    order: 'relevance',
    page: 1
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = async (e?: React.FormEvent, page: number = 1) => {
    e?.preventDefault();
    if (!searchQuery.trim() && currentView === 'search') return;

    setIsLoading(true);
    try {
      let results;
      const searchFilters = { ...filters, page };
      
      switch (currentView) {
        case 'trending':
          results = await window.f95Api.games.getTrending(page);
          break;
        case 'latest':
          results = await window.f95Api.games.getLatest(page);
          break;
        default:
          results = await window.f95Api.games.search(searchQuery, searchFilters);
      }
      
      if (page === 1) {
        setSearchResults(results);
      } else {
        setSearchResults(prev => [...prev, ...results]);
      }
      setCurrentPage(page);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrending = async () => {
    setCurrentView('trending');
    setCurrentPage(1);
    setSearchResults([]);
    handleSearch(undefined, 1);
  };

  const loadLatest = async () => {
    setCurrentView('latest');
    setCurrentPage(1);
    setSearchResults([]);
    handleSearch(undefined, 1);
  };

  const loadMore = () => {
    handleSearch(undefined, currentPage + 1);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setSearchResults([]);
    if (searchQuery.trim()) {
      handleSearch(undefined, 1);
    }
  };

  const handleAddToLibrary = async (game: GameInfo) => {
    setSelectedGame(game);
    setShowAddModal(true);
  };

  const handleSelectFolder = async () => {
    try {
      const directory = await window.f95Api.settings.selectDirectory();
      if (directory) {
        setGamePath(directory);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleConfirmAdd = async () => {
    if (!selectedGame || !gamePath) return;

    setIsAdding(true);
    try {
      const gameData = {
        name: selectedGame.name,
        developer: selectedGame.developer,
        version: selectedGame.version,
        f95Url: selectedGame.threadUrl,
        description: selectedGame.description,
        tags: selectedGame.tags || [],
        engine: selectedGame.engine || { name: 'Unknown' },
        // Pass all metadata for sync
        cover: selectedGame.cover,
        previewImages: selectedGame.previewImages,
        genre: selectedGame.genre,
        censored: selectedGame.censored,
        mod: selectedGame.mod,
        os: selectedGame.os,
        authors: selectedGame.authors,
        prefixes: selectedGame.prefixes,
        rating: selectedGame.rating,
        views: selectedGame.views,
        status: selectedGame.status,
        category: selectedGame.category,
        changelog: selectedGame.changelog,
        threadPublishingDate: selectedGame.threadPublishingDate,
        lastRelease: selectedGame.lastRelease
      };

      await window.f95Api.library.addManual(gamePath, gameData);
      alert(`${selectedGame.name} added to library!`);
      setShowAddModal(false);
      setGamePath('');
      setSelectedGame(null);
    } catch (error) {
      console.error('Failed to add game to library:', error);
      alert('Failed to add game to library');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setGamePath('');
    setSelectedGame(null);
  };

  return (
    <div className="flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold mb-4">Discover Games</h1>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setCurrentView('search')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              currentView === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Search size={20} />
            <span>Search</span>
          </button>
          
          <button
            onClick={loadTrending}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              currentView === 'trending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <TrendingUp size={20} />
            <span>Trending</span>
          </button>
          
          <button
            onClick={loadLatest}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              currentView === 'latest'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Clock size={20} />
            <span>Latest</span>
          </button>
        </div>

        {currentView === 'search' && (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search for games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Filter size={20} />
                <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-700 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
                    <select
                      value={filters.order}
                      onChange={(e) => handleFilterChange({ order: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Latest Updates</option>
                      <option value="views">Most Popular</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Engine</label>
                    <input
                      type="text"
                      placeholder="e.g. Ren'Py, Unity, RPGM"
                      value={filters.engine || ''}
                      onChange={(e) => handleFilterChange({ engine: e.target.value || undefined })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. 3dcg, romance, adventure"
                      value={filters.tags?.join(', ') || ''}
                      onChange={(e) => handleFilterChange({ 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-400">Loading...</div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold mb-2">No results</h2>
            <p>Try searching for something or browse trending games</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.map((game) => (
                <GameCard
                  key={game.id}
                  game={{
                    ...game,
                    installed: false,
                    favorite: false,
                    playTime: 0
                  }}
                  onAdd={() => handleAddToLibrary(game)}
                  onLaunch={() => {}}
                  onToggleFavorite={() => {}}
                  onRemove={() => {}}
                  onOpenFolder={() => {}}
                  showLibraryActions={false}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {searchResults.length > 0 && !isLoading && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Game Modal */}
      {showAddModal && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Game to Library</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-lg mb-2">{selectedGame.name}</h3>
              <p className="text-gray-400 text-sm mb-4">
                Select the folder where this game is installed:
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game Folder *
              </label>
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

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmAdd}
                disabled={!gamePath || isAdding}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                {isAdding ? 'Adding...' : 'Add to Library'}
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
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