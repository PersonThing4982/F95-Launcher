import { login, UserProfile } from '@millenniumearl/f95api';
import { AuthResult } from '../../shared/types';
import { ConfigManager } from '../config/configManager';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthManager');

export class AuthManager {
  private userProfile: UserProfile | null = null;
  private isAuthenticated: boolean = false;
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async login(username: string, password: string, on2FARequest?: () => Promise<string>): Promise<AuthResult> {
    try {
      logger.info(`Attempting login for user: ${username}`);
      
      const result = await login(username, password, on2FARequest);
      
      if (result.success) {
        this.isAuthenticated = true;
        
        this.userProfile = new UserProfile();
        await this.userProfile.fetch();
        
        await this.configManager.saveCredentials(username, password);
        
        logger.info(`Login successful for user: ${this.userProfile.name}`);
        
        return {
          success: true,
          username: this.userProfile.name,
          avatar: this.userProfile.avatar
        };
      }
      
      logger.warn(`Login failed: ${result.message}`);
      return {
        success: false,
        message: result.message || 'Login failed'
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      this.isAuthenticated = false;
      this.userProfile = null;
      await this.configManager.clearCredentials();
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async autoLogin(): Promise<AuthResult> {
    try {
      const credentials = await this.configManager.getCredentials();
      if (!credentials) {
        return { success: false, message: 'No saved credentials' };
      }

      const result = await login(credentials.username, credentials.password);
      if (result.success) {
        this.isAuthenticated = true;
        this.userProfile = new UserProfile();
        await this.userProfile.fetch();
        return {
          success: true,
          username: this.userProfile.name,
          avatar: this.userProfile.avatar
        };
      }
      return { success: false, message: result.message };
    } catch (error) {
      logger.error('Auto-login error:', error);
      return { success: false, message: 'Auto-login failed' };
    }
  }

  getAuthStatus(): boolean {
    return this.isAuthenticated;
  }

  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  async getWatchedThreads(): Promise<any[]> {
    if (!this.isAuthenticated || !this.userProfile) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.userProfile.watched;
    } catch (error) {
      logger.error('Failed to fetch watched threads:', error);
      throw error;
    }
  }
}