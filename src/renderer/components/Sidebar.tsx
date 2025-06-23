import React from 'react';
import { 
  Library, 
  Search, 
  Settings, 
  Download, 
  LogOut,
  Heart,
  Clock,
  Gamepad2,
  WifiOff
} from 'lucide-react';
import { ViewType } from './MainScreen';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  isOfflineMode?: boolean;
}

export function Sidebar({ currentView, onViewChange, onLogout, isOfflineMode = false }: SidebarProps) {
  const menuItems = [
    { id: 'library' as ViewType, icon: Library, label: 'Library' },
    { id: 'search' as ViewType, icon: Search, label: 'Search', disabled: isOfflineMode },
    { id: 'settings' as ViewType, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        {isOfflineMode && (
          <div className="mb-3 flex items-center space-x-2 text-orange-400 text-sm">
            <WifiOff size={16} />
            <span>Offline Mode</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Gamepad2 className="text-blue-400" size={24} />
          <span className="font-bold text-lg">F95 Launcher</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && onViewChange(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                item.disabled
                  ? 'text-gray-500 cursor-not-allowed'
                  : currentView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.disabled && <span className="text-xs">(Sign in required)</span>}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Access</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
              <Heart size={16} />
              <span className="text-sm">Favorites</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
              <Clock size={16} />
              <span className="text-sm">Recent</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>{isOfflineMode ? 'Sign In' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}