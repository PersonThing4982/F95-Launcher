import { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';
// F95API functions imported in individual modules
import { AuthManager } from './auth/authManager';
import { GameLibrary } from './library/gameLibrary';
import { GameAPI } from './api/gameAPI';
import { GameLauncher } from './launcher/gameLauncher';
import { UpdateChecker } from './updater/updateChecker';
import { ConfigManager } from './config/configManager';
import { createLogger } from './utils/logger';
import {
  validateInput,
  authLoginSchema,
  gameSearchSchema,
  gameDetailsSchema,
  gameIdSchema,
  gameUpdateSchema,
  settingsSchema,
  pathSchema,
  urlSchema,
  RateLimit,
  isValidUrl,
} from './utils/validation';

const logger = createLogger('Main');
const isDev = process.env.NODE_ENV === 'development';

class F95LauncherApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private authManager: AuthManager;
  private gameLibrary: GameLibrary;
  private gameAPI: GameAPI;
  private gameLauncher: GameLauncher;
  private updateChecker: UpdateChecker;
  private configManager: ConfigManager;
  private loginRateLimit: RateLimit;
  private authenticatedUsers: Set<string> = new Set();

  constructor() {
    this.configManager = new ConfigManager();
    this.authManager = new AuthManager(this.configManager);
    this.gameLibrary = new GameLibrary(this.configManager.getAppDataPath());
    this.gameAPI = new GameAPI(this.configManager.getCachePath());
    this.gameLauncher = new GameLauncher();
    this.updateChecker = new UpdateChecker(this.gameAPI, this.gameLibrary);
    this.loginRateLimit = new RateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

    this.setupIpcHandlers();
    this.initializeApp();
  }

  private async initializeApp() {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });

    await this.configManager.ensureDirectories();

    app.whenReady().then(() => {
      this.createWindow();
      this.createTray();
      this.checkAutoLogin();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      icon: path.join(__dirname, '../../../assets/icon.png'),
      frame: false,
      backgroundColor: '#1e1e1e',
      show: false,
    });

    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray() {
    const icon = nativeImage.createFromPath(path.join(__dirname, '../../../assets/icon.png'));
    this.tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => this.mainWindow?.show(),
      },
      {
        label: 'Check for Updates',
        click: async () => {
          const updates = await this.updateChecker.checkAllGames();
          this.mainWindow?.webContents.send('updates:available', updates);
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]);

    this.tray.setToolTip('F95 Game Launcher');
    this.tray.setContextMenu(contextMenu);

    this.tray.on('click', () => {
      this.mainWindow?.show();
    });
  }

  private requireAuth(event: Electron.IpcMainInvokeEvent): void {
    const sessionId = event.sender.id.toString();
    if (!this.authenticatedUsers.has(sessionId)) {
      throw new Error('Authentication required');
    }
  }

  private setupIpcHandlers() {
    // Authentication
    ipcMain.handle('auth:login', async (event, username: unknown, password: unknown) => {
      try {
        // Rate limiting
        const clientId = event.sender.id.toString();
        if (!this.loginRateLimit.isAllowed(clientId)) {
          const remainingTime = this.loginRateLimit.getRemainingTime(clientId);
          throw new Error(
            `Too many login attempts. Please try again in ${Math.ceil(remainingTime / 1000 / 60)} minutes`,
          );
        }

        // Input validation
        const { username: validUsername, password: validPassword } = validateInput(
          authLoginSchema,
          { username, password },
        );

        const on2FARequest = async () => {
          return new Promise<string>((resolve) => {
            this.mainWindow?.webContents.send('auth:2fa-request');
            ipcMain.once('auth:2fa-code', (_, code: string) => resolve(code));
          });
        };

        const result = await this.authManager.login(validUsername, validPassword, on2FARequest);

        if (result.success) {
          this.authenticatedUsers.add(clientId);
          this.loginRateLimit.reset(clientId);
        }

        return result;
      } catch (error) {
        logger.error('Login error:', error);
        throw error;
      }
    });

    ipcMain.handle('auth:logout', (event) => {
      const sessionId = event.sender.id.toString();
      this.authenticatedUsers.delete(sessionId);
      return this.authManager.logout();
    });

    ipcMain.handle('auth:check', (event) => {
      const sessionId = event.sender.id.toString();
      const isAuthenticated =
        this.authManager.getAuthStatus() && this.authenticatedUsers.has(sessionId);
      return { authenticated: isAuthenticated };
    });

    // Game Search
    ipcMain.handle('games:search', async (event, query: unknown, filters?: unknown) => {
      this.requireAuth(event);
      const validatedData = validateInput(gameSearchSchema, { query, filters });
      return this.gameAPI.searchGames(validatedData.query, validatedData.filters);
    });

    ipcMain.handle('games:details', async (event, url: unknown) => {
      this.requireAuth(event);
      const { url: validUrl } = validateInput(gameDetailsSchema, { url });
      return this.gameAPI.getGameDetails(validUrl);
    });

    ipcMain.handle('games:latest', async (event, page?: unknown) => {
      this.requireAuth(event);
      const validPage = page ? Math.max(1, Math.min(1000, Number(page))) : undefined;
      return this.gameAPI.getLatestUpdates(validPage);
    });

    ipcMain.handle('games:trending', async (event, page?: unknown) => {
      this.requireAuth(event);
      const validPage = page ? Math.max(1, Math.min(1000, Number(page))) : undefined;
      return this.gameAPI.getTrendingGames(validPage);
    });

    ipcMain.handle('games:by-tag', async (event, tag: unknown, page?: unknown) => {
      this.requireAuth(event);
      if (typeof tag !== 'string' || tag.length === 0) {
        throw new Error('Tag must be a non-empty string');
      }
      const validPage = page ? Math.max(1, Math.min(1000, Number(page))) : undefined;
      return this.gameAPI.getGamesByTag(tag, validPage);
    });

    ipcMain.handle('games:watched', async (event) => {
      this.requireAuth(event);
      const threads = await this.authManager.getWatchedThreads();
      const games: any[] = [];
      for (const thread of threads) {
        try {
          if (isValidUrl(thread.url)) {
            const game = await this.gameAPI.getGameDetails(thread.url);
            games.push(game);
          }
        } catch (error) {
          logger.warn(`Failed to fetch watched game: ${thread.url}`);
        }
      }
      return games;
    });

    // Library
    ipcMain.handle('library:get-all', (event) => {
      this.requireAuth(event);
      return this.gameLibrary.getAllGames();
    });

    ipcMain.handle('library:add', (event, game: unknown) => {
      this.requireAuth(event);
      if (!game || typeof game !== 'object') {
        throw new Error('Invalid game data');
      }
      return this.gameLibrary.addGame(game);
    });

    ipcMain.handle('library:remove', (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      return this.gameLibrary.removeGame(validGameId);
    });

    ipcMain.handle('library:update', (event, gameId: unknown, updates: unknown) => {
      this.requireAuth(event);
      const validatedData = validateInput(gameUpdateSchema, { gameId, updates });
      return this.gameLibrary.updateGame(validatedData.gameId, validatedData.updates);
    });
    ipcMain.handle('library:get-installed', (event) => {
      this.requireAuth(event);
      return this.gameLibrary.getInstalledGames();
    });

    ipcMain.handle('library:get-favorites', (event) => {
      this.requireAuth(event);
      return this.gameLibrary.getFavoriteGames();
    });

    ipcMain.handle('library:get-recent', (event, limit: unknown) => {
      this.requireAuth(event);
      const validLimit = limit ? Math.max(1, Math.min(100, Number(limit))) : undefined;
      return this.gameLibrary.getRecentlyPlayedGames(validLimit);
    });

    ipcMain.handle('library:search', (event, query: unknown) => {
      this.requireAuth(event);
      if (typeof query !== 'string' || query.length === 0) {
        throw new Error('Query must be a non-empty string');
      }
      return this.gameLibrary.searchGames(query);
    });

    ipcMain.handle('library:import-bookmarks', (event, bookmarks: unknown) => {
      this.requireAuth(event);
      if (!Array.isArray(bookmarks)) {
        throw new Error('Bookmarks must be an array');
      }
      return this.gameLibrary.importFromF95Bookmarks(bookmarks);
    });

    ipcMain.handle('library:statistics', (event) => {
      this.requireAuth(event);
      return this.gameLibrary.getStatistics();
    });

    // Launcher
    ipcMain.handle('launcher:launch', async (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });

      const game = this.gameLibrary.getGame(validGameId);
      if (!game) throw new Error('Game not found');

      await this.gameLauncher.launchGame(game);
      await this.gameLibrary.updateGame(validGameId, {
        lastPlayed: new Date(),
        playTime: (game.playTime || 0) + 1,
      });
    });

    ipcMain.handle('launcher:stop', (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      return this.gameLauncher.stopGame(validGameId);
    });

    ipcMain.handle('launcher:is-running', (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      return this.gameLauncher.isGameRunning(validGameId);
    });

    ipcMain.handle('launcher:get-running', (event) => {
      this.requireAuth(event);
      return this.gameLauncher.getRunningGames();
    });
    ipcMain.handle('launcher:verify', async (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });

      const game = this.gameLibrary.getGame(validGameId);
      if (!game) throw new Error('Game not found');
      return this.gameLauncher.verifyGameInstallation(game);
    });

    ipcMain.handle('launcher:open-folder', async (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });

      const game = this.gameLibrary.getGame(validGameId);
      if (!game) throw new Error('Game not found');
      return this.gameLauncher.openGameFolder(game);
    });
    ipcMain.handle('launcher:set-executable', (event, gameId: unknown, path: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      const { path: validPath } = validateInput(pathSchema, { path });
      return this.gameLibrary.setGameExecutable(validGameId, validPath);
    });

    ipcMain.handle('launcher:detect-installed', (event, path: unknown) => {
      this.requireAuth(event);
      const { path: validPath } = validateInput(pathSchema, { path });
      return this.gameLauncher.detectInstalledGames(validPath);
    });
    ipcMain.handle('library:link-f95', (event, gameId: unknown, url: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      const { url: validUrl } = validateInput(urlSchema, { url });
      return this.gameLibrary.linkGameToF95(validGameId, validUrl);
    });

    ipcMain.handle('library:sync-metadata', (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      return this.gameLibrary.syncGameMetadata(validGameId, this.gameAPI);
    });

    ipcMain.handle('library:add-manual', (event, gamePath: unknown, customData: unknown) => {
      this.requireAuth(event);
      const { path: validPath } = validateInput(pathSchema, { path: gamePath });
      if (customData && typeof customData !== 'object') {
        throw new Error('Custom data must be an object');
      }
      return this.gameLibrary.addManualGame(validPath, customData);
    });

    // Updates
    ipcMain.handle('updates:check-all', (event) => {
      this.requireAuth(event);
      return this.updateChecker.checkAllGames();
    });

    ipcMain.handle('updates:check-game', async (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });

      const game = this.gameLibrary.getGame(validGameId);
      if (!game) throw new Error('Game not found');
      return this.updateChecker.checkGameForUpdate(game);
    });

    ipcMain.handle('updates:get-history', async (event, gameId: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });

      const game = this.gameLibrary.getGame(validGameId);
      if (!game) throw new Error('Game not found');
      return this.updateChecker.getUpdateHistory(game);
    });

    ipcMain.handle('updates:mark-applied', (event, gameId: unknown, version: unknown) => {
      this.requireAuth(event);
      const { gameId: validGameId } = validateInput(gameIdSchema, { gameId });
      if (typeof version !== 'string' || version.length === 0) {
        throw new Error('Version must be a non-empty string');
      }
      return this.updateChecker.markUpdateApplied(validGameId, version);
    });

    // Settings
    ipcMain.handle('settings:get', (event) => {
      this.requireAuth(event);
      return this.configManager.getSettings();
    });

    ipcMain.handle('settings:save', (event, settings: unknown) => {
      this.requireAuth(event);
      const validSettings = validateInput(settingsSchema, settings);
      return this.configManager.saveSettings(validSettings);
    });

    ipcMain.handle('settings:select-directory', async (event) => {
      this.requireAuth(event);
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory'],
      });
      return result.filePaths[0];
    });

    ipcMain.handle('settings:clear-cache', async (event) => {
      this.requireAuth(event);
      await this.configManager.clearCache();
      await this.gameAPI.clearCache();
    });

    // System
    ipcMain.handle('system:open-external', (event, url: unknown) => {
      this.requireAuth(event);
      const { url: validUrl } = validateInput(urlSchema, { url });
      return shell.openExternal(validUrl);
    });

    ipcMain.handle('window:minimize', () => this.mainWindow?.minimize());
    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });
    ipcMain.handle('window:close', () => this.mainWindow?.close());
    ipcMain.handle('system:get-version', () => app.getVersion());
  }

  private async checkAutoLogin() {
    try {
      const result = await this.authManager.autoLogin();
      if (result.success) {
        logger.info('Auto-login successful');
        const settings = this.configManager.getSettings();
        if (settings.autoCheckUpdates) {
          this.updateChecker.startAutoCheck(settings.updateCheckInterval);
        }
      }
    } catch (error) {
      logger.error('Auto-login failed:', error);
    }
  }
}

new F95LauncherApp();
