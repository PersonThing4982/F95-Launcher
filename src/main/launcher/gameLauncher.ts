import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { LibraryGame } from '../../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('GameLauncher');

export class GameLauncher {
  private runningGames: Map<number, ChildProcess> = new Map();

  async launchGame(game: LibraryGame): Promise<void> {
    if (!game.installed || !game.installPath) {
      throw new Error('Game is not installed');
    }

    if (this.runningGames.has(game.id)) {
      throw new Error('Game is already running');
    }

    try {
      const executable = await this.findExecutable(game);
      
      logger.info(`Launching game: ${game.name} from ${executable}`);
      
      const gameProcess = spawn(executable, [], {
        cwd: game.installPath,
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          RENPY_SKIP_SPLASHSCREEN: '1'
        }
      });

      gameProcess.unref();

      this.runningGames.set(game.id, gameProcess);

      gameProcess.on('exit', (code) => {
        logger.info(`Game ${game.name} exited with code ${code}`);
        this.runningGames.delete(game.id);
      });

      gameProcess.on('error', (error) => {
        logger.error(`Game ${game.name} error:`, error);
        this.runningGames.delete(game.id);
      });

    } catch (error) {
      logger.error(`Failed to launch game ${game.name}:`, error);
      throw error;
    }
  }

  async findExecutable(game: LibraryGame): Promise<string> {
    if (!game.installPath) {
      throw new Error('No install path specified');
    }

    if (game.executable) {
      const execPath = path.join(game.installPath, game.executable);
      if (await fs.pathExists(execPath)) {
        await fs.chmod(execPath, 0o755);
        return execPath;
      }
    }

    const files = await fs.readdir(game.installPath);
    
    const executables = await this.findLinuxExecutables(game.installPath, files);
    
    if (executables.length === 0) {
      throw new Error('No executable found for the game');
    }

    const executable = executables[0];
    await fs.chmod(executable, 0o755);
    
    return executable;
  }

  private async findLinuxExecutables(gamePath: string, files: string[]): Promise<string[]> {
    const executables: string[] = [];
    const executablePatterns = [
      /\.sh$/,
      /^[^.]+$/,
      /linux/i,
      /\.py$/
    ];

    const commonExecutables = [
      'game.sh',
      'start.sh',
      'run.sh',
      'launcher.sh',
      game => `${game.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.sh`,
      game => `${game.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      'renpy.sh',
      'lib/linux-x86_64/renpy',
      'lib/linux-i686/renpy'
    ];

    for (const pattern of commonExecutables) {
      const filename = typeof pattern === 'function' ? pattern({ name: path.basename(gamePath) }) : pattern;
      const fullPath = path.join(gamePath, filename);
      
      if (await fs.pathExists(fullPath)) {
        const stat = await fs.stat(fullPath);
        if (!stat.isDirectory()) {
          executables.push(fullPath);
        }
      }
    }

    for (const file of files) {
      const fullPath = path.join(gamePath, file);
      const stat = await fs.stat(fullPath);
      
      if (!stat.isDirectory()) {
        for (const pattern of executablePatterns) {
          if (pattern.test(file)) {
            const content = await fs.readFile(fullPath, 'utf8').catch(() => '');
            if (content.includes('#!/') || content.includes('python') || content.includes('renpy')) {
              executables.push(fullPath);
              break;
            }
          }
        }
      }
    }

    const priorityOrder = [
      file => file.endsWith('.sh'),
      file => file.includes('start'),
      file => file.includes('run'),
      file => file.includes('launcher'),
      file => file.includes('game'),
      file => !file.includes('.')
    ];

    executables.sort((a, b) => {
      for (const priority of priorityOrder) {
        const aPriority = priority(a) ? 1 : 0;
        const bPriority = priority(b) ? 1 : 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
      }
      return 0;
    });

    return executables;
  }

  isGameRunning(gameId: number): boolean {
    return this.runningGames.has(gameId);
  }

  async stopGame(gameId: number): Promise<void> {
    const process = this.runningGames.get(gameId);
    if (process) {
      try {
        process.kill();
        this.runningGames.delete(gameId);
        logger.info(`Stopped game with ID: ${gameId}`);
      } catch (error) {
        logger.error(`Failed to stop game ${gameId}:`, error);
        throw error;
      }
    }
  }

  getRunningGames(): number[] {
    return Array.from(this.runningGames.keys());
  }

  async verifyGameInstallation(game: LibraryGame): Promise<boolean> {
    if (!game.installPath || !await fs.pathExists(game.installPath)) {
      return false;
    }

    try {
      const executable = await this.findExecutable(game);
      return await fs.pathExists(executable);
    } catch {
      return false;
    }
  }

  async openGameFolder(game: LibraryGame): Promise<void> {
    if (!game.installPath) {
      throw new Error('Game has no install path');
    }

    const { shell } = require('electron');
    await shell.openPath(game.installPath);
  }

  async detectInstalledGames(searchPath: string): Promise<string[]> {
    const possibleGames: string[] = [];
    
    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const gamePath = path.join(searchPath, entry.name);
          const files = await fs.readdir(gamePath);
          
          const hasExecutable = files.some(file => 
            file.endsWith('.sh') || 
            file.includes('renpy') ||
            file === 'game.py'
          );
          
          if (hasExecutable) {
            possibleGames.push(gamePath);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to detect installed games:', error);
    }
    
    return possibleGames;
  }
}