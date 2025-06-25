import { GameAPI } from '../api/gameAPI';
import { GameLibrary } from '../library/gameLibrary';
import { UpdateInfo, LibraryGame } from '../../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('UpdateChecker');

export class UpdateChecker {
  private gameAPI: GameAPI;
  private gameLibrary: GameLibrary;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(gameAPI: GameAPI, gameLibrary: GameLibrary) {
    this.gameAPI = gameAPI;
    this.gameLibrary = gameLibrary;
  }

  async checkGameForUpdate(game: LibraryGame): Promise<UpdateInfo | null> {
    try {
      logger.debug(`Checking for updates: ${game.name}`);

      const latestInfo = await this.gameAPI.getGameDetails(game.threadUrl);

      if (this.isNewerVersion(latestInfo.version, game.version)) {
        logger.info(`Update available for ${game.name}: ${game.version} -> ${latestInfo.version}`);

        return {
          gameId: game.id,
          gameName: game.name,
          currentVersion: game.version,
          newVersion: latestInfo.version,
          updateUrl: game.threadUrl,
          changelog: latestInfo.description,
        };
      }

      return null;
    } catch (error) {
      logger.error(`Failed to check updates for ${game.name}:`, error);
      return null;
    }
  }

  async checkAllGames(): Promise<UpdateInfo[]> {
    const games = this.gameLibrary.getAllGames();
    const updates: UpdateInfo[] = [];

    logger.info(`Checking updates for ${games.length} games`);

    const checkPromises = games.map(async (game) => {
      const update = await this.checkGameForUpdate(game);
      if (update) {
        updates.push(update);
      }
    });

    await Promise.all(checkPromises);

    logger.info(`Found ${updates.length} games with updates`);
    return updates;
  }

  startAutoCheck(intervalMinutes: number): void {
    this.stopAutoCheck();

    const interval = intervalMinutes * 60 * 1000;

    this.checkInterval = setInterval(async () => {
      logger.info('Running automatic update check');
      await this.checkAllGames();
    }, interval);

    logger.info(`Started automatic update checks every ${intervalMinutes} minutes`);
  }

  stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped automatic update checks');
    }
  }

  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    try {
      const parseVersion = (version: string) => {
        const cleaned = version.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.').map((part) => parseInt(part, 10) || 0);
        while (parts.length < 3) parts.push(0);
        return parts;
      };

      const newParts = parseVersion(newVersion);
      const currentParts = parseVersion(currentVersion);

      for (let i = 0; i < 3; i++) {
        if (newParts[i] > currentParts[i]) return true;
        if (newParts[i] < currentParts[i]) return false;
      }

      return false;
    } catch (error) {
      logger.error('Version comparison error:', error);
      return false;
    }
  }

  async getUpdateHistory(game: LibraryGame): Promise<string[]> {
    const history: string[] = [];

    try {
      const gameInfo = await this.gameAPI.getGameDetails(game.threadUrl);

      if (gameInfo.description) {
        const changelogMatch = gameInfo.description.match(
          /changelog|change\s*log|updates?|what'?s?\s*new/i,
        );
        if (changelogMatch) {
          const changelogSection = gameInfo.description.substring(changelogMatch.index || 0);
          const lines = changelogSection.split('\n').slice(0, 20);
          history.push(...lines.filter((line) => line.trim().length > 0));
        }
      }
    } catch (error) {
      logger.error(`Failed to get update history for ${game.name}:`, error);
    }

    return history;
  }

  async markUpdateApplied(gameId: number, newVersion: string): Promise<void> {
    await this.gameLibrary.updateGame(gameId, { version: newVersion });
    logger.info(`Marked game ${gameId} as updated to version ${newVersion}`);
  }
}
