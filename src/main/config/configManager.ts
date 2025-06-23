import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
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
  private credentialsPath: string;
  private settings: Settings;
  private encryptionKey: Buffer;

  constructor() {
    const appDataPath = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.f95launcher'
    );

    this.configPath = appDataPath;
    this.settingsPath = path.join(appDataPath, 'settings.json');
    this.credentialsPath = path.join(appDataPath, '.credentials');

    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.settings = this.loadSettings();
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
        'F95Games'
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
      hardwareAcceleration: true
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
    const credentials: Credentials = { username, password };
    const encrypted = this.encrypt(JSON.stringify(credentials));
    
    try {
      await fs.ensureDir(this.configPath);
      await fs.writeFile(this.credentialsPath, encrypted);
      logger.info('Credentials saved securely');
    } catch (error) {
      logger.error('Failed to save credentials:', error);
      throw error;
    }
  }

  async getCredentials(): Promise<Credentials | null> {
    try {
      if (!await fs.pathExists(this.credentialsPath)) {
        return null;
      }

      const encrypted = await fs.readFile(this.credentialsPath);
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to load credentials:', error);
      return null;
    }
  }

  async clearCredentials(): Promise<void> {
    try {
      if (await fs.pathExists(this.credentialsPath)) {
        await fs.remove(this.credentialsPath);
        logger.info('Credentials cleared');
      }
    } catch (error) {
      logger.error('Failed to clear credentials:', error);
      throw error;
    }
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

  private getOrCreateEncryptionKey(): Buffer {
    const keyPath = path.join(this.configPath, '.key');
    
    try {
      fs.ensureDirSync(this.configPath);
      
      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath);
      } else {
        const key = crypto.randomBytes(32);
        fs.writeFileSync(keyPath, key);
        fs.chmodSync(keyPath, 0o600);
        return key;
      }
    } catch (error) {
      logger.error('Failed to manage encryption key:', error);
      return crypto.scryptSync('f95launcher', 'salt', 32);
    }
  }

  private encrypt(text: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return Buffer.concat([iv, encrypted]);
  }

  private decrypt(buffer: Buffer): string {
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }
}