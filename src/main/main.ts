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

  constructor() {
    this.configManager = new ConfigManager();
    this.authManager = new AuthManager(this.configManager);
    this.gameLibrary = new GameLibrary(this.configManager.getAppDataPath());
    this.gameAPI = new GameAPI(this.configManager.getCachePath());
    this.gameLauncher = new GameLauncher();
    this.updateChecker = new UpdateChecker(this.gameAPI, this.gameLibrary);

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
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../../../assets/icon.png'),
      frame: false,
      backgroundColor: '#1e1e1e',
      show: false
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
        click: () => this.mainWindow?.show()
      },
      {
        label: 'Check for Updates',
        click: async () => {
          const updates = await this.updateChecker.checkAllGames();
          this.mainWindow?.webContents.send('updates:available', updates);
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);

    this.tray.setToolTip('F95 Game Launcher');
    this.tray.setContextMenu(contextMenu);
    
    this.tray.on('click', () => {
      this.mainWindow?.show();
    });
  }

  private setupIpcHandlers() {
    // Authentication
    ipcMain.handle('auth:login', async (_, username: string, password: string) => {
      const on2FARequest = async () => {
        return new Promise<string>((resolve) => {
          this.mainWindow?.webContents.send('auth:2fa-request');
          ipcMain.once('auth:2fa-code', (_, code: string) => resolve(code));
        });
      };
      return this.authManager.login(username, password, on2FARequest);
    });

    ipcMain.handle('auth:logout', () => this.authManager.logout());
    ipcMain.handle('auth:check', () => ({ 
      authenticated: this.authManager.getAuthStatus() 
    }));

    // Game Search
    ipcMain.handle('games:search', async (_, query: string, filters?: any) => {
      if (!this.authManager.getAuthStatus()) throw new Error('Not authenticated');
      return this.gameAPI.searchGames(query, filters);
    });

    ipcMain.handle('games:details', async (_, url: string) => {
      if (!this.authManager.getAuthStatus()) throw new Error('Not authenticated');
      return this.gameAPI.getGameDetails(url);
    });

    ipcMain.handle('games:latest', async (_, page?: number) => {
      if (!this.authManager.getAuthStatus()) throw new Error('Not authenticated');
      return this.gameAPI.getLatestUpdates(page);
    });

    ipcMain.handle('games:trending', async (_, page?: number) => {
      if (!this.authManager.getAuthStatus()) throw new Error('Not authenticated');
      return this.gameAPI.getTrendingGames(page);
    });

    ipcMain.handle('games:by-tag', async (_, tag: string, page?: number) => {
      if (!this.authManager.getAuthStatus()) throw new Error('Not authenticated');
      return this.gameAPI.getGamesByTag(tag, page);
    });

    ipcMain.handle('games:watched', async () => {
      if (!this.authManager.getAuthStatus()) throw new Error('Not authenticated');
      const threads = await this.authManager.getWatchedThreads();
      const games: any[] = [];
      for (const thread of threads) {
        try {
          const game = await this.gameAPI.getGameDetails(thread.url);
          games.push(game);
        } catch (error) {
          logger.warn(`Failed to fetch watched game: ${thread.url}`);
        }
      }
      return games;
    });

    // Library
    ipcMain.handle('library:get-all', () => this.gameLibrary.getAllGames());
    ipcMain.handle('library:add', (_, game) => this.gameLibrary.addGame(game));
    ipcMain.handle('library:remove', (_, gameId) => this.gameLibrary.removeGame(gameId));
    ipcMain.handle('library:update', (_, gameId, updates) => 
      this.gameLibrary.updateGame(gameId, updates));
    ipcMain.handle('library:get-installed', () => this.gameLibrary.getInstalledGames());
    ipcMain.handle('library:get-favorites', () => this.gameLibrary.getFavoriteGames());
    ipcMain.handle('library:get-recent', (_, limit) => 
      this.gameLibrary.getRecentlyPlayedGames(limit));
    ipcMain.handle('library:search', (_, query) => this.gameLibrary.searchGames(query));
    ipcMain.handle('library:import-bookmarks', (_, bookmarks) => 
      this.gameLibrary.importFromF95Bookmarks(bookmarks));
    ipcMain.handle('library:statistics', () => this.gameLibrary.getStatistics());

    // Launcher
    ipcMain.handle('launcher:launch', async (_, gameId) => {
      const game = this.gameLibrary.getGame(gameId);
      if (!game) throw new Error('Game not found');
      
      await this.gameLauncher.launchGame(game);
      await this.gameLibrary.updateGame(gameId, {
        lastPlayed: new Date(),
        playTime: (game.playTime || 0) + 1
      });
    });

    ipcMain.handle('launcher:stop', (_, gameId) => this.gameLauncher.stopGame(gameId));
    ipcMain.handle('launcher:is-running', (_, gameId) => 
      this.gameLauncher.isGameRunning(gameId));
    ipcMain.handle('launcher:get-running', () => this.gameLauncher.getRunningGames());
    ipcMain.handle('launcher:verify', async (_, gameId) => {
      const game = this.gameLibrary.getGame(gameId);
      if (!game) throw new Error('Game not found');
      return this.gameLauncher.verifyGameInstallation(game);
    });
    ipcMain.handle('launcher:open-folder', async (_, gameId) => {
      const game = this.gameLibrary.getGame(gameId);
      if (!game) throw new Error('Game not found');
      return this.gameLauncher.openGameFolder(game);
    });
    ipcMain.handle('launcher:set-executable', (_, gameId, path) => 
      this.gameLibrary.setGameExecutable(gameId, path));
    ipcMain.handle('launcher:detect-installed', (_, path) => 
      this.gameLauncher.detectInstalledGames(path));
    ipcMain.handle('library:link-f95', (_, gameId, url) => 
      this.gameLibrary.linkGameToF95(gameId, url));
    ipcMain.handle('library:sync-metadata', (_, gameId) => 
      this.gameLibrary.syncGameMetadata(gameId, this.gameAPI));
    ipcMain.handle('library:add-manual', (_, gamePath, customData) => 
      this.gameLibrary.addManualGame(gamePath, customData));

    // Updates
    ipcMain.handle('updates:check-all', () => this.updateChecker.checkAllGames());
    ipcMain.handle('updates:check-game', async (_, gameId) => {
      const game = this.gameLibrary.getGame(gameId);
      if (!game) throw new Error('Game not found');
      return this.updateChecker.checkGameForUpdate(game);
    });
    ipcMain.handle('updates:get-history', async (_, gameId) => {
      const game = this.gameLibrary.getGame(gameId);
      if (!game) throw new Error('Game not found');
      return this.updateChecker.getUpdateHistory(game);
    });
    ipcMain.handle('updates:mark-applied', (_, gameId, version) => 
      this.updateChecker.markUpdateApplied(gameId, version));

    // Settings
    ipcMain.handle('settings:get', () => this.configManager.getSettings());
    ipcMain.handle('settings:save', (_, settings) => this.configManager.saveSettings(settings));
    ipcMain.handle('settings:select-directory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      });
      return result.filePaths[0];
    });
    ipcMain.handle('settings:clear-cache', async () => {
      await this.configManager.clearCache();
      await this.gameAPI.clearCache();
    });

    // System
    ipcMain.handle('system:open-external', (_, url) => shell.openExternal(url));
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