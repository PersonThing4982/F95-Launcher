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

      // Validate executable path to prevent command injection
      this.validateExecutablePath(executable, game.installPath);

      logger.info(`Launching game: ${game.name} from ${executable}`);

      // Use execFile for better security than spawn with shell
      const gameProcess = spawn(executable, [], {
        cwd: game.installPath,
        detached: true,
        stdio: 'ignore',
        shell: false, // Explicitly disable shell to prevent injection
        env: {
          ...process.env,
          RENPY_SKIP_SPLASHSCREEN: '1',
        },
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

  private validateExecutablePath(execPath: string, installPath: string): void {
    // Normalize paths to prevent path traversal
    const normalizedExecPath = path.normalize(execPath);
    const normalizedInstallPath = path.normalize(installPath);

    // Ensure executable is within the game installation directory
    if (!normalizedExecPath.startsWith(normalizedInstallPath)) {
      throw new Error('Executable path is outside game installation directory');
    }

    // Check for dangerous characters that could be used for command injection
    const dangerousChars = /[;&|`$(){}[\]<>]/;
    if (dangerousChars.test(execPath)) {
      throw new Error('Executable path contains potentially dangerous characters');
    }

    // Ensure the file exists and is a regular file
    if (!fs.existsSync(normalizedExecPath)) {
      throw new Error('Executable does not exist');
    }

    const stats = fs.statSync(normalizedExecPath);
    if (!stats.isFile()) {
      throw new Error('Executable path is not a regular file');
    }
  }

  async findExecutable(game: LibraryGame): Promise<string> {
    if (!game.installPath) {
      throw new Error('No install path specified');
    }

    // Validate install path
    const normalizedInstallPath = path.normalize(game.installPath);
    if (!(await fs.pathExists(normalizedInstallPath))) {
      throw new Error('Install path does not exist');
    }

    if (game.executable) {
      // Sanitize the executable name
      const sanitizedExecutable = path.basename(game.executable);
      const execPath = path.join(normalizedInstallPath, sanitizedExecutable);

      if (await fs.pathExists(execPath)) {
        await fs.chmod(execPath, 0o755);
        return execPath;
      }
    }

    const files = await fs.readdir(normalizedInstallPath);

    // Platform-specific executable search
    const isWindows = process.platform === 'win32';
    const executables = isWindows
      ? await this.findWindowsExecutables(normalizedInstallPath, files)
      : await this.findLinuxExecutables(normalizedInstallPath, files);

    if (executables.length === 0) {
      throw new Error('No executable found for the game');
    }

    const executable = executables[0];

    // Set executable permissions on Unix-like systems
    if (!isWindows) {
      await fs.chmod(executable, 0o755);
    }

    return executable;
  }

  private async findWindowsExecutables(gamePath: string, files: string[]): Promise<string[]> {
    const executables: string[] = [];
    const executableExtensions = ['.exe', '.bat', '.cmd'];

    // Common Windows executable names
    const commonExecutables = [
      'game.exe',
      'start.exe',
      'launcher.exe',
      'run.bat',
      (game) => `${game.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.exe`,
      'renpy.exe',
      'lib/windows-i686/renpy.exe',
      'lib/windows-x86_64/renpy.exe',
    ];

    // Check common executable names first
    for (const pattern of commonExecutables) {
      const filename =
        typeof pattern === 'function' ? pattern({ name: path.basename(gamePath) }) : pattern;
      const fullPath = path.join(gamePath, filename);

      if (await fs.pathExists(fullPath)) {
        const stat = await fs.stat(fullPath);
        if (!stat.isDirectory()) {
          executables.push(fullPath);
        }
      }
    }

    // Search for any executable files
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (executableExtensions.includes(ext)) {
        const fullPath = path.join(gamePath, file);
        const stat = await fs.stat(fullPath);

        if (!stat.isDirectory()) {
          executables.push(fullPath);
        }
      }
    }

    return this.prioritizeExecutables(executables);
  }

  private async findLinuxExecutables(gamePath: string, files: string[]): Promise<string[]> {
    const executables: string[] = [];
    const executablePatterns = [/\.sh$/, /^[^.]+$/, /linux/i, /\.py$/];

    const commonExecutables = [
      'game.sh',
      'start.sh',
      'run.sh',
      'launcher.sh',
      (game) => `${game.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.sh`,
      (game) => `${game.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      'renpy.sh',
      'lib/linux-x86_64/renpy',
      'lib/linux-i686/renpy',
    ];

    for (const pattern of commonExecutables) {
      const filename =
        typeof pattern === 'function' ? pattern({ name: path.basename(gamePath) }) : pattern;
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
            if (
              content.includes('#!/') ||
              content.includes('python') ||
              content.includes('renpy')
            ) {
              executables.push(fullPath);
              break;
            }
          }
        }
      }
    }

    return this.prioritizeExecutables(executables);
  }

  private prioritizeExecutables(executables: string[]): string[] {
    const priorityOrder = [
      (file) => file.includes('start'),
      (file) => file.includes('launcher'),
      (file) => file.includes('game'),
      (file) => file.includes('run'),
      (file) => path.extname(file) === '.exe',
      (file) => path.extname(file) === '.sh',
      (file) => !file.includes('.'),
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
    if (!game.installPath || !(await fs.pathExists(game.installPath))) {
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

    // Validate the path before opening
    const normalizedPath = path.normalize(game.installPath);
    if (!(await fs.pathExists(normalizedPath))) {
      throw new Error('Game install path does not exist');
    }

    const { shell } = require('electron');
    await shell.openPath(normalizedPath);
  }

  async detectInstalledGames(searchPath: string): Promise<string[]> {
    const possibleGames: string[] = [];

    try {
      // Validate and normalize search path
      const normalizedSearchPath = path.normalize(searchPath);
      if (!(await fs.pathExists(normalizedSearchPath))) {
        return possibleGames;
      }

      const entries = await fs.readdir(normalizedSearchPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const gamePath = path.join(normalizedSearchPath, entry.name);
          const files = await fs.readdir(gamePath);

          const isWindows = process.platform === 'win32';
          const hasExecutable = files.some((file) => {
            if (isWindows) {
              return file.endsWith('.exe') || file.endsWith('.bat');
            } else {
              return file.endsWith('.sh') || file.includes('renpy') || file === 'game.py';
            }
          });

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
