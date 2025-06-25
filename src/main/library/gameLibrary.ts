import * as fs from 'fs-extra';
import * as path from 'path';
import { LibraryGame } from '../../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('GameLibrary');

export class GameLibrary {
  private libraryPath: string;
  private games: Map<number, LibraryGame>;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor(appDataPath: string) {
    this.libraryPath = path.join(appDataPath, 'library.json');
    this.games = new Map();
    this.loadLibrary();
  }

  private async loadLibrary(): Promise<void> {
    try {
      if (await fs.pathExists(this.libraryPath)) {
        const data = await fs.readJson(this.libraryPath);
        if (Array.isArray(data)) {
          data.forEach((game) => {
            this.games.set(game.id, {
              ...game,
              lastUpdate: new Date(game.lastUpdate),
              lastPlayed: game.lastPlayed ? new Date(game.lastPlayed) : undefined,
            });
          });
        }
        logger.info(`Loaded ${this.games.size} games from library`);
      }
    } catch (error) {
      logger.error('Failed to load library:', error);
    }
  }

  private async saveLibrary(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(async () => {
      try {
        const data = Array.from(this.games.values());
        await fs.writeJson(this.libraryPath, data, { spaces: 2 });
        logger.debug('Library saved successfully');
      } catch (error) {
        logger.error('Failed to save library:', error);
      }
    }, 1000);
  }

  async addGame(game: Partial<LibraryGame>): Promise<LibraryGame> {
    if (!game.id) throw new Error('Game ID is required');

    const libraryGame: LibraryGame = {
      id: game.id,
      name: game.name || 'Unknown Game',
      version: game.version || '0.0.0',
      developer: game.developer || 'Unknown',
      engine: game.engine,
      status: game.status || 'Unknown',
      tags: game.tags || [],
      rating: game.rating || 0,
      views: game.views || 0,
      lastUpdate: game.lastUpdate || new Date(),
      threadUrl: game.threadUrl || '',
      previewImages: game.previewImages,
      description: game.description,
      installed: false,
      favorite: false,
      playTime: 0,
      ...game,
    };

    this.games.set(libraryGame.id, libraryGame);
    await this.saveLibrary();

    logger.info(`Added game to library: ${libraryGame.name} (ID: ${libraryGame.id})`);
    return libraryGame;
  }

  async removeGame(gameId: number): Promise<boolean> {
    const game = this.games.get(gameId);
    if (!game) return false;

    // Only remove from library, never delete files from PC
    // Game files remain on the user's system
    this.games.delete(gameId);
    await this.saveLibrary();

    logger.info(`Removed game from library (files preserved): ${game.name} (ID: ${gameId})`);
    return true;
  }

  async updateGame(gameId: number, updates: Partial<LibraryGame>): Promise<LibraryGame | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    const updatedGame = { ...game, ...updates };
    this.games.set(gameId, updatedGame);
    await this.saveLibrary();

    logger.debug(`Updated game: ${updatedGame.name} (ID: ${gameId})`);
    return updatedGame;
  }

  getGame(gameId: number): LibraryGame | undefined {
    return this.games.get(gameId);
  }

  getAllGames(): LibraryGame[] {
    return Array.from(this.games.values());
  }

  getInstalledGames(): LibraryGame[] {
    return this.getAllGames().filter((game) => game.installed);
  }

  getFavoriteGames(): LibraryGame[] {
    return this.getAllGames().filter((game) => game.favorite);
  }

  getRecentlyPlayedGames(limit: number = 10): LibraryGame[] {
    return this.getAllGames()
      .filter((game) => game.lastPlayed)
      .sort((a, b) => {
        const dateA = a.lastPlayed?.getTime() || 0;
        const dateB = b.lastPlayed?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  searchGames(query: string): LibraryGame[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllGames().filter(
      (game) =>
        game.name.toLowerCase().includes(lowercaseQuery) ||
        game.developer.toLowerCase().includes(lowercaseQuery) ||
        game.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)) ||
        game.customTags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
    );
  }

  async importFromF95Bookmarks(bookmarks: any[]): Promise<number> {
    let imported = 0;

    for (const bookmark of bookmarks) {
      try {
        if (!this.games.has(bookmark.id)) {
          await this.addGame({
            id: bookmark.id,
            name: bookmark.name,
            version: bookmark.version,
            developer: bookmark.developer,
            engine: bookmark.engine,
            status: bookmark.status,
            tags: bookmark.tags,
            rating: bookmark.rating,
            views: bookmark.views,
            lastUpdate: new Date(bookmark.lastUpdate),
            threadUrl: bookmark.url,
            previewImages: bookmark.previewImages,
            description: bookmark.overview,
          });
          imported++;
        }
      } catch (error) {
        logger.error(`Failed to import bookmark: ${bookmark.name}`, error);
      }
    }

    logger.info(`Imported ${imported} games from F95 bookmarks`);
    return imported;
  }

  async setGameExecutable(gameId: number, executablePath: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    const fullPath = path.join(game.installPath || '', executablePath);
    if (!(await fs.pathExists(fullPath))) {
      throw new Error('Executable not found');
    }

    await this.updateGame(gameId, { executable: executablePath });
  }

  async linkGameToF95(gameId: number, f95Url: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    // Validate F95 URL format
    if (!f95Url.includes('f95zone.to/threads/')) {
      throw new Error('Invalid F95Zone URL format');
    }

    await this.updateGame(gameId, { threadUrl: f95Url });
    logger.info(`Linked game ${game.name} to F95 URL: ${f95Url}`);
  }

  async syncGameMetadata(gameId: number, gameAPI: any): Promise<LibraryGame | null> {
    const game = this.games.get(gameId);
    if (!game || !game.threadUrl) {
      throw new Error('Game not found or no F95 URL linked');
    }

    try {
      const onlineData = await gameAPI.getGameDetails(game.threadUrl);

      // Update with online metadata while preserving local data
      const updatedGame = {
        ...game,
        name: onlineData.name,
        version: onlineData.version,
        developer: onlineData.developer,
        engine: onlineData.engine,
        status: onlineData.status,
        tags: onlineData.tags,
        rating: onlineData.rating,
        views: onlineData.views,
        lastUpdate: onlineData.lastUpdate,
        previewImages: onlineData.previewImages,
        cover: onlineData.cover, // Add cover image mapping
        description: onlineData.description,
        // Add additional metadata fields
        genre: onlineData.genre,
        censored: onlineData.censored,
        mod: onlineData.mod,
        os: onlineData.os,
        authors: onlineData.authors,
        prefixes: onlineData.prefixes,
        changelog: onlineData.changelog,
        threadPublishingDate: onlineData.threadPublishingDate,
        lastRelease: onlineData.lastRelease,
        category: onlineData.category,
      };

      await this.updateGame(gameId, updatedGame);
      logger.info(`Synced metadata for game: ${game.name}`);
      return updatedGame;
    } catch (error) {
      logger.error(`Failed to sync metadata for game ${game.name}:`, error);
      throw error;
    }
  }

  async addManualGame(gamePath: string, customData?: any): Promise<LibraryGame> {
    const gameDir = path.basename(gamePath);
    const gameId = Date.now(); // Simple ID generation for manual games

    const manualGame: LibraryGame = {
      id: gameId,
      name: customData?.name || gameDir,
      version: customData?.version || '1.0.0',
      developer: customData?.developer || 'Unknown',
      engine: customData?.engine,
      status: 'Unknown',
      tags: customData?.tags || [],
      rating: 0,
      views: 0,
      lastUpdate: new Date(),
      threadUrl: customData?.f95Url || '',
      previewImages: [],
      description: customData?.description || '',
      installed: true,
      installPath: gamePath,
      favorite: false,
      playTime: 0,
      manuallyAdded: true,
      localMetadata: {
        customName: customData?.name,
        customDeveloper: customData?.developer,
        customVersion: customData?.version,
        customTags: customData?.tags,
      },
    };

    this.games.set(gameId, manualGame);
    await this.saveLibrary();

    logger.info(`Added manual game: ${manualGame.name} from ${gamePath}`);
    return manualGame;
  }

  getTotalPlayTime(): number {
    return this.getAllGames().reduce((total, game) => total + (game.playTime || 0), 0);
  }

  getStatistics() {
    const games = this.getAllGames();
    return {
      total: games.length,
      installed: games.filter((g) => g.installed).length,
      favorites: games.filter((g) => g.favorite).length,
      totalPlayTime: this.getTotalPlayTime(),
      byEngine: this.groupByEngine(),
      byStatus: this.groupByStatus(),
    };
  }

  private groupByEngine(): Record<string, number> {
    const groups: Record<string, number> = {};
    this.getAllGames().forEach((game) => {
      const engine = game.engine?.name || 'Unknown';
      groups[engine] = (groups[engine] || 0) + 1;
    });
    return groups;
  }

  private groupByStatus(): Record<string, number> {
    const groups: Record<string, number> = {};
    this.getAllGames().forEach((game) => {
      const status = game.status || 'Unknown';
      groups[status] = (groups[status] || 0) + 1;
    });
    return groups;
  }
}
