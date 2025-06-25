import { contextBridge, ipcRenderer } from 'electron';
import { LibraryGame, UpdateInfo, Settings, SearchFilters } from '../shared/types';

const api = {
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    checkStatus: () => ipcRenderer.invoke('auth:check'),
    on2FARequest: (callback: () => void) => {
      ipcRenderer.on('auth:2fa-request', callback);
    },
    send2FACode: (code: string) => ipcRenderer.send('auth:2fa-code', code),
  },

  games: {
    search: (query: string, filters?: SearchFilters) =>
      ipcRenderer.invoke('games:search', query, filters),
    getDetails: (url: string) => ipcRenderer.invoke('games:details', url),
    getLatest: (page?: number) => ipcRenderer.invoke('games:latest', page),
    getTrending: (page?: number) => ipcRenderer.invoke('games:trending', page),
    getByTag: (tag: string, page?: number) => ipcRenderer.invoke('games:by-tag', tag, page),
    getWatched: () => ipcRenderer.invoke('games:watched'),
  },

  library: {
    getAll: () => ipcRenderer.invoke('library:get-all'),
    add: (game: Partial<LibraryGame>) => ipcRenderer.invoke('library:add', game),
    remove: (gameId: number) => ipcRenderer.invoke('library:remove', gameId),
    update: (gameId: number, updates: Partial<LibraryGame>) =>
      ipcRenderer.invoke('library:update', gameId, updates),
    getInstalled: () => ipcRenderer.invoke('library:get-installed'),
    getFavorites: () => ipcRenderer.invoke('library:get-favorites'),
    getRecent: (limit?: number) => ipcRenderer.invoke('library:get-recent', limit),
    search: (query: string) => ipcRenderer.invoke('library:search', query),
    importBookmarks: (bookmarks: any[]) =>
      ipcRenderer.invoke('library:import-bookmarks', bookmarks),
    getStatistics: () => ipcRenderer.invoke('library:statistics'),
    linkF95: (gameId: number, url: string) => ipcRenderer.invoke('library:link-f95', gameId, url),
    syncMetadata: (gameId: number) => ipcRenderer.invoke('library:sync-metadata', gameId),
    addManual: (gamePath: string, customData?: any) =>
      ipcRenderer.invoke('library:add-manual', gamePath, customData),
  },

  launcher: {
    launch: (gameId: number) => ipcRenderer.invoke('launcher:launch', gameId),
    stop: (gameId: number) => ipcRenderer.invoke('launcher:stop', gameId),
    isRunning: (gameId: number) => ipcRenderer.invoke('launcher:is-running', gameId),
    getRunning: () => ipcRenderer.invoke('launcher:get-running'),
    verify: (gameId: number) => ipcRenderer.invoke('launcher:verify', gameId),
    openFolder: (gameId: number) => ipcRenderer.invoke('launcher:open-folder', gameId),
    setExecutable: (gameId: number, path: string) =>
      ipcRenderer.invoke('launcher:set-executable', gameId, path),
    detectInstalled: (path: string) => ipcRenderer.invoke('launcher:detect-installed', path),
  },

  updates: {
    checkAll: () => ipcRenderer.invoke('updates:check-all'),
    checkGame: (gameId: number) => ipcRenderer.invoke('updates:check-game', gameId),
    getHistory: (gameId: number) => ipcRenderer.invoke('updates:get-history', gameId),
    markApplied: (gameId: number, version: string) =>
      ipcRenderer.invoke('updates:mark-applied', gameId, version),
    onAvailable: (callback: (updates: UpdateInfo[]) => void) => {
      ipcRenderer.on('updates:available', (_, updates) => callback(updates));
    },
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: Partial<Settings>) => ipcRenderer.invoke('settings:save', settings),
    selectDirectory: () => ipcRenderer.invoke('settings:select-directory'),
    clearCache: () => ipcRenderer.invoke('settings:clear-cache'),
  },

  system: {
    openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    getVersion: () => ipcRenderer.invoke('system:get-version'),
  },
};

contextBridge.exposeInMainWorld('f95Api', api);

export type F95Api = typeof api;
