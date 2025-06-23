import { searchHandiwork, getHandiworkFromURL, Game, HandiworkSearchQuery } from '@millenniumearl/f95api';
import { GameInfo, SearchFilters } from '../../shared/types';
import { createLogger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

const logger = createLogger('GameAPI');

export class GameAPI {
  private cachePath: string;
  private cacheExpiry: number = 3600000; // 1 hour

  constructor(cachePath: string) {
    this.cachePath = path.join(cachePath, 'games');
    fs.ensureDirSync(this.cachePath);
  }

  async searchGames(query: string, filters: SearchFilters = {}): Promise<GameInfo[]> {
    try {
      const searchQuery = new HandiworkSearchQuery();
      searchQuery.keywords = query;
      searchQuery.category = 'games';
      searchQuery.includedTags = filters.tags || [];
      searchQuery.order = filters.order || 'relevance';
      searchQuery.page = filters.page || 1;

      logger.info(`Searching games with query: "${query}"`);
      
      const games = await searchHandiwork(searchQuery, Game);
      
      const gameInfos = games.map(game => this.convertToGameInfo(game));
      
      if (filters.engine) {
        return gameInfos.filter(game => 
          game.engine?.name?.toLowerCase().includes(filters.engine!.toLowerCase())
        );
      }
      
      return gameInfos;
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  async getGameDetails(url: string): Promise<GameInfo> {
    try {
      const cacheKey = this.getCacheKey(url);
      const cached = await this.getFromCache(cacheKey);
      
      if (cached) {
        logger.debug(`Returning cached game details for: ${url}`);
        return cached;
      }

      logger.info(`Fetching game details from: ${url}`);
      const game = await getHandiworkFromURL(url, Game);
      
      if (!game) {
        throw new Error('Game not found');
      }

      const gameInfo = this.convertToGameInfo(game);
      await this.saveToCache(cacheKey, gameInfo);
      
      return gameInfo;
    } catch (error) {
      logger.error('Get game details error:', error);
      throw error;
    }
  }

  async getGameByThread(threadId: number): Promise<GameInfo> {
    const url = `https://f95zone.to/threads/${threadId}/`;
    return this.getGameDetails(url);
  }

  async getLatestUpdates(page: number = 1): Promise<GameInfo[]> {
    try {
      const searchQuery = new HandiworkSearchQuery();
      searchQuery.category = 'games';
      searchQuery.order = 'date';
      searchQuery.page = page;

      const games = await searchHandiwork(searchQuery, Game);
      return games.map(game => this.convertToGameInfo(game));
    } catch (error) {
      logger.error('Get latest updates error:', error);
      throw error;
    }
  }

  async getTrendingGames(page: number = 1): Promise<GameInfo[]> {
    try {
      const searchQuery = new HandiworkSearchQuery();
      searchQuery.category = 'games';
      searchQuery.order = 'views';
      searchQuery.page = page;

      const games = await searchHandiwork(searchQuery, Game);
      return games.map(game => this.convertToGameInfo(game));
    } catch (error) {
      logger.error('Get trending games error:', error);
      throw error;
    }
  }

  async getGamesByTag(tag: string, page: number = 1): Promise<GameInfo[]> {
    try {
      const searchQuery = new HandiworkSearchQuery();
      searchQuery.category = 'games';
      searchQuery.includedTags = [tag];
      searchQuery.order = 'relevance';
      searchQuery.page = page;

      const games = await searchHandiwork(searchQuery, Game);
      return games.map(game => this.convertToGameInfo(game));
    } catch (error) {
      logger.error('Get games by tag error:', error);
      throw error;
    }
  }

  private convertToGameInfo(game: any): GameInfo {
    return {
      id: game.id || 0,
      name: game.name || 'Unknown Game',
      version: game.version || '0.0.0',
      developer: game.authors && game.authors.length > 0 ? game.authors[0].name : 'Unknown',
      engine: game.engine ? {
        name: typeof game.engine === 'string' ? game.engine : game.engine.name || game.engine,
        version: game.engine.version
      } : undefined,
      status: game.status || 'Unknown',
      tags: game.tags || [],
      rating: typeof game.rating === 'object' ? game.rating.average || 0 : (game.rating || 0),
      views: 0, // Not available in current API
      lastUpdate: new Date(game.lastThreadUpdate || game.lastRelease || Date.now()),
      threadUrl: game.url || '',
      previewImages: game.previews || [],
      description: game.overview || '',
      
      // Extended F95API metadata
      cover: game.cover,
      changelog: Array.isArray(game.changelog) ? game.changelog.join('\n') : (game.changelog || ''),
      genre: game.genre || [],
      censored: game.censored,
      mod: false, // Not directly available in current API
      os: game.os || [],
      threadPublishingDate: game.threadPublishingDate ? new Date(game.threadPublishingDate) : undefined,
      lastRelease: game.lastRelease ? new Date(game.lastRelease) : undefined,
      prefixes: game.prefixes || [],
      category: game.category || '',
      authors: game.authors || []
    };
  }

  private getCacheKey(url: string): string {
    return url.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private async getFromCache(key: string): Promise<GameInfo | null> {
    try {
      const cachePath = path.join(this.cachePath, `${key}.json`);
      
      if (!await fs.pathExists(cachePath)) {
        return null;
      }

      const stat = await fs.stat(cachePath);
      const age = Date.now() - stat.mtimeMs;
      
      if (age > this.cacheExpiry) {
        await fs.remove(cachePath);
        return null;
      }

      const data = await fs.readJson(cachePath);
      data.lastUpdate = new Date(data.lastUpdate);
      return data;
    } catch (error) {
      logger.error('Cache read error:', error);
      return null;
    }
  }

  private async saveToCache(key: string, data: GameInfo): Promise<void> {
    try {
      const cachePath = path.join(this.cachePath, `${key}.json`);
      await fs.writeJson(cachePath, data, { spaces: 2 });
    } catch (error) {
      logger.error('Cache write error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await fs.emptyDir(this.cachePath);
      logger.info('Game cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }
}