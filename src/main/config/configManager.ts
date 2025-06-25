import * as fs from 'fs-extra';
import * as path from 'path';
import * as keytar from 'keytar';
import { Settings } from '../../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ConfigManager');

interface Credentials {
  username: string;
  password: string;
}

export class ConfigManager {
  private configPath: string;
  private settingsPath: string;
  private settings: Settings;
  private readonly SERVICE_NAME = 'F95Launcher';
  private readonly ACCOUNT_NAME = 'default';

  constructor() {
    const appDataPath = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.f95launcher',
    );

    this.configPath = appDataPath;
    this.settingsPath = path.join(appDataPath, 'settings.json');
    this.settings = this.loadSettings();

    // Migrate old credentials if they exist
    this.migrateOldCredentials();
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  async saveSettings(newSettings: Partial<Settings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };

    try {
      await fs.ensureDir(this.configPath);
      await fs.writeJson(this.settingsPath, this.settings, { spaces: 2 });
      logger.info('Settings saved successfully');
    } catch (error) {
      logger.error('Failed to save settings:', error);
      throw error;
    }
  }

  private loadSettings(): Settings {
    const defaultSettings: Settings = {
      gamesDirectory: path.join(
        process.env.HOME || process.env.USERPROFILE || '.',
        'Games',
        'F95Games',
      ),
      maxConcurrentDownloads: 3,
      autoCheckUpdates: true,
      updateCheckInterval: 360,
      launchInFullscreen: false,
      closeOnGameLaunch: false,
      minimizeToTray: true,
      theme: 'dark',
      language: 'en',
      showNSFWThumbnails: true,
      enableNotifications: true,
      startWithSystem: false,
      hardwareAcceleration: true,
    };

    try {
      if (fs.existsSync(this.settingsPath)) {
        const loadedSettings = fs.readJsonSync(this.settingsPath);
        return { ...defaultSettings, ...loadedSettings };
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }

    return defaultSettings;
  }

  async saveCredentials(username: string, password: string): Promise<void> {
    try {
      // Save username in settings (non-sensitive)
      await this.saveSettings({ lastUsername: username });

      // Save password securely in system keychain
      await keytar.setPassword(this.SERVICE_NAME, this.ACCOUNT_NAME, password);

      logger.info('Credentials saved securely in system keychain');
    } catch (error) {
      logger.error('Failed to save credentials:', error);
      throw new Error('Failed to save credentials securely');
    }
  }

  async getCredentials(): Promise<Credentials | null> {
    try {
      const password = await keytar.getPassword(this.SERVICE_NAME, this.ACCOUNT_NAME);
      const username = this.settings.lastUsername;

      if (password && username) {
        return { username, password };
      }

      return null;
    } catch (error) {
      logger.error('Failed to load credentials:', error);
      return null;
    }
  }

  async clearCredentials(): Promise<void> {
    try {
      await keytar.deletePassword(this.SERVICE_NAME, this.ACCOUNT_NAME);
      await this.saveSettings({ lastUsername: undefined });
      logger.info('Credentials cleared');
    } catch (error) {
      logger.error('Failed to clear credentials:', error);
      throw error;
    }
  }

  private async migrateOldCredentials(): Promise<void> {
    const oldCredentialsPath = path.join(this.configPath, '.credentials');
    const oldKeyPath = path.join(this.configPath, '.key');

    try {
      // Check if old credential files exist
      if ((await fs.pathExists(oldCredentialsPath)) && (await fs.pathExists(oldKeyPath))) {
        logger.info('Found old credential files, attempting migration...');

        // Read and decrypt old credentials
        const encryptionKey = await fs.readFile(oldKeyPath);
        const encrypted = await fs.readFile(oldCredentialsPath);

        // Decrypt using old method
        const decrypted = this.legacyDecrypt(encrypted, encryptionKey);
        const credentials = JSON.parse(decrypted);

        // Save using new secure method
        await this.saveCredentials(credentials.username, credentials.password);

        // Remove old files
        await fs.remove(oldCredentialsPath);
        await fs.remove(oldKeyPath);

        logger.info('Successfully migrated credentials to system keychain');
      }
    } catch (error) {
      logger.error('Failed to migrate old credentials:', error);
      // Remove old files anyway to prevent security risk
      try {
        await fs.remove(oldCredentialsPath);
        await fs.remove(oldKeyPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  private legacyDecrypt(buffer: Buffer, key: Buffer): string {
    const crypto = require('crypto');
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  getGamesDirectory(): string {
    return this.settings.gamesDirectory;
  }

  async setGamesDirectory(directory: string): Promise<void> {
    await fs.ensureDir(directory);
    await this.saveSettings({ gamesDirectory: directory });
  }

  getAppDataPath(): string {
    return this.configPath;
  }

  getCachePath(): string {
    return path.join(this.configPath, 'cache');
  }

  async ensureDirectories(): Promise<void> {
    await fs.ensureDir(this.configPath);
    await fs.ensureDir(this.getGamesDirectory());
    await fs.ensureDir(this.getCachePath());
  }

  async clearCache(): Promise<void> {
    const cachePath = this.getCachePath();
    try {
      await fs.remove(cachePath);
      await fs.ensureDir(cachePath);
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      throw error;
    }
  }
}
