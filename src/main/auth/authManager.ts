import { login, UserProfile } from '@millenniumearl/f95api';
import { AuthResult } from '../../shared/types';
import { ConfigManager } from '../config/configManager';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthManager');

export class AuthManager {
  private userProfile: UserProfile | null = null;
  private isAuthenticated: boolean = false;
  private configManager: ConfigManager;
  private twoFactorTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async login(
    username: string,
    password: string,
    on2FARequest?: () => Promise<string>,
  ): Promise<AuthResult> {
    try {
      logger.info('Attempting login for user: [REDACTED]');

      // Enhanced 2FA handler with timeout
      const enhanced2FAHandler = on2FARequest
        ? async () => {
            return new Promise<string>((resolve, reject) => {
              // Set up 5 minute timeout for 2FA
              const timeoutId = setTimeout(
                () => {
                  this.twoFactorTimeouts.delete(username);
                  reject(new Error('2FA timeout - please try again'));
                },
                5 * 60 * 1000,
              );

              this.twoFactorTimeouts.set(username, timeoutId);

              on2FARequest()
                .then((code) => {
                  const existingTimeout = this.twoFactorTimeouts.get(username);
                  if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    this.twoFactorTimeouts.delete(username);
                  }
                  resolve(code);
                })
                .catch((error) => {
                  const existingTimeout = this.twoFactorTimeouts.get(username);
                  if (existingTimeout) {
                    clearTimeout(existingTimeout);
                    this.twoFactorTimeouts.delete(username);
                  }
                  reject(error);
                });
            });
          }
        : undefined;

      const result = await login(username, password, enhanced2FAHandler);

      if (result.success) {
        this.isAuthenticated = true;

        this.userProfile = new UserProfile();
        await this.userProfile.fetch();

        await this.configManager.saveCredentials(username, password);

        logger.info('Login successful for user: [REDACTED]');

        return {
          success: true,
          username: this.userProfile.name,
          avatar: this.userProfile.avatar,
        };
      }

      logger.warn(`Login failed: ${result.message}`);
      return {
        success: false,
        message: result.message || 'Login failed',
      };
    } catch (error) {
      logger.error('Login error:', error);

      // Clean up any pending 2FA timeouts
      const timeoutId = this.twoFactorTimeouts.get(username);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.twoFactorTimeouts.delete(username);
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      this.isAuthenticated = false;
      this.userProfile = null;

      // Clear any pending 2FA timeouts
      this.twoFactorTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.twoFactorTimeouts.clear();

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
          avatar: this.userProfile.avatar,
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

  // Cancel any pending 2FA request
  cancel2FA(username: string): void {
    const timeoutId = this.twoFactorTimeouts.get(username);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.twoFactorTimeouts.delete(username);
    }
  }
}
