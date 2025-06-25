export interface GameInfo {
  id: number;
  name: string;
  version: string;
  developer: string;
  engine?: {
    name: string;
    version?: string;
  };
  status: string;
  tags: string[];
  rating: number;
  views: number;
  lastUpdate: Date;
  threadUrl: string;
  previewImages?: string[];
  description?: string;

  // Extended F95API metadata
  cover?: string;
  changelog?: string;
  genre?: string[];
  censored?: boolean;
  mod?: boolean;
  os?: string[];
  threadPublishingDate?: Date;
  lastRelease?: Date;
  prefixes?: string[];
  category?: string;
  authors?: {
    name: string;
    url?: string;
  }[];
}

export interface LibraryGame extends GameInfo {
  installed: boolean;
  installPath?: string;
  lastPlayed?: Date;
  playTime?: number;
  favorite: boolean;
  customTags?: string[];
  notes?: string;
  executable?: string;
  manuallyAdded?: boolean;
  localMetadata?: {
    customName?: string;
    customDeveloper?: string;
    customVersion?: string;
    customTags?: string[];
  };
}

export interface DownloadProgress {
  gameId: number;
  downloadId: string;
  progress: number;
  speed?: number;
  remaining?: number;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  error?: string;
}

export interface AuthResult {
  success: boolean;
  username?: string;
  avatar?: string;
  message?: string;
}

export interface UpdateInfo {
  gameId: number;
  gameName: string;
  currentVersion: string;
  newVersion: string;
  updateUrl: string;
  changelog?: string;
}

export interface Settings {
  gamesDirectory: string;
  maxConcurrentDownloads: number;
  autoCheckUpdates: boolean;
  updateCheckInterval: number;
  launchInFullscreen: boolean;
  closeOnGameLaunch: boolean;
  minimizeToTray: boolean;
  theme: 'dark' | 'light' | 'auto';
  language: string;
  showNSFWThumbnails: boolean;
  enableNotifications: boolean;
  startWithSystem: boolean;
  hardwareAcceleration: boolean;
  lastUsername?: string;
}

export interface SearchFilters {
  tags?: string[];
  order?: 'relevance' | 'date' | 'likes' | 'views' | 'title';
  page?: number;
  status?: string[];
  engine?: string;
}

export interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  platform: string;
  additionalContext?: Record<string, unknown>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount?: number;
}

export interface CrashReport extends ErrorReport {
  type: 'crash' | 'error' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  breadcrumbs?: Array<{
    timestamp: string;
    message: string;
    category: string;
    level: 'info' | 'warning' | 'error';
  }>;
}
