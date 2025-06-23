import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { LibraryView } from './LibraryView';
import { SearchView } from './SearchView';
import { SettingsView } from './SettingsView';

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
        return <LibraryView />;
      case 'search':
        return <SearchView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <LibraryView />;
    }
  };

  return (
    <div className="flex-1 flex min-h-0">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLogout={onLogout}
        isOfflineMode={isOfflineMode}
      />
      <main className="flex-1 bg-gray-900 min-h-0">
        {renderView()}
      </main>
    </div>
  );
}