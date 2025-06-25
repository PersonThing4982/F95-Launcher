import { z } from 'zod';

// Define validation schemas for IPC handlers
export const authLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(1000, 'Password too long'),
});

export const gameSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200, 'Query too long'),
  filters: z
    .object({
      tags: z.array(z.string()).optional(),
      order: z.enum(['relevance', 'date', 'likes', 'views', 'title']).optional(),
      page: z.number().int().min(1).max(1000).optional(),
      status: z.array(z.string()).optional(),
      engine: z.string().optional(),
    })
    .optional(),
});

export const gameDetailsSchema = z.object({
  url: z
    .string()
    .url('Invalid URL format')
    .refine(
      (url) => url.includes('f95zone.to') || url.includes('f95zone.com'),
      'URL must be from F95Zone',
    ),
});

export const gameIdSchema = z.object({
  gameId: z.number().int().positive('Game ID must be positive'),
});

export const gameUpdateSchema = z.object({
  gameId: z.number().int().positive('Game ID must be positive'),
  updates: z.object({
    installed: z.boolean().optional(),
    installPath: z.string().optional(),
    lastPlayed: z.date().optional(),
    playTime: z.number().min(0).optional(),
    favorite: z.boolean().optional(),
    customTags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    executable: z.string().optional(),
  }),
});

export const settingsSchema = z.object({
  gamesDirectory: z.string().min(1, 'Games directory is required'),
  maxConcurrentDownloads: z.number().int().min(1).max(10),
  autoCheckUpdates: z.boolean(),
  updateCheckInterval: z.number().int().min(5).max(1440),
  launchInFullscreen: z.boolean(),
  closeOnGameLaunch: z.boolean(),
  minimizeToTray: z.boolean(),
  theme: z.enum(['dark', 'light', 'auto']),
  language: z.string().min(2).max(5),
  showNSFWThumbnails: z.boolean(),
  enableNotifications: z.boolean(),
  startWithSystem: z.boolean(),
  hardwareAcceleration: z.boolean(),
  lastUsername: z.string().optional(),
});

export const pathSchema = z.object({
  path: z
    .string()
    .min(1, 'Path is required')
    .refine((path) => {
      // Prevent path traversal
      const dangerousPatterns = /(\.\.[\/\\]|[;&|`$(){}[\]<>])/;
      return !dangerousPatterns.test(path);
    }, 'Path contains dangerous characters'),
});

export const urlSchema = z.object({
  url: z
    .string()
    .url('Invalid URL format')
    .refine((url) => {
      // Only allow HTTP/HTTPS URLs
      return url.startsWith('http://') || url.startsWith('https://');
    }, 'Only HTTP/HTTPS URLs are allowed'),
});

// Rate limiting helper
export class RateLimit {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    return Math.max(0, record.resetTime - Date.now());
  }
}

// Input validation wrapper
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

// Sanitization helpers
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters for filenames
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255);
}

export function sanitizePath(inputPath: string): string {
  // Normalize and validate path
  const normalizedPath = inputPath.replace(/\\/g, '/');

  // Remove path traversal attempts
  const safePath = normalizedPath
    .split('/')
    .filter((part) => part !== '..' && part !== '.')
    .join('/');

  return safePath;
}

export function isValidGameId(id: unknown): id is number {
  return typeof id === 'number' && Number.isInteger(id) && id > 0;
}

export function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
