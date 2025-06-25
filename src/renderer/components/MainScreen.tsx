import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { LibraryView } from './LibraryView';
import { SearchView } from './SearchView';
import { SettingsView } from './SettingsView';
import ErrorBoundary from './ErrorBoundary';

interface MainScreenProps {
  onLogout: () => void;
  isOfflineMode?: boolean;
}

export type ViewType = 'library' | 'search' | 'settings';

export function MainScreen({ onLogout, isOfflineMode = false }: MainScreenProps) {
  const [currentView, setCurrentView] = useState<ViewType>('library');

  const renderView = () => {
    switch (currentView) {
      case 'library':
        return (
          <ErrorBoundary isolate>
            <LibraryView />
          </ErrorBoundary>
        );
      case 'search':
        return (
          <ErrorBoundary isolate>
            <SearchView />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary isolate>
            <SettingsView />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary isolate>
            <LibraryView />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="flex-1 flex min-h-0">
      <ErrorBoundary isolate>
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={onLogout}
          isOfflineMode={isOfflineMode}
        />
      </ErrorBoundary>
      <main className="flex-1 bg-gray-900 min-h-0">{renderView()}</main>
    </div>
  );
}
