import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  const handleMinimize = () => window.f95Api.system.minimize();
  const handleMaximize = () => window.f95Api.system.maximize();
  const handleClose = () => window.f95Api.system.close();

  return (
    <div className="h-8 bg-gray-800 flex items-center justify-between px-4 drag-region sticky top-0 z-50">
      <div className="text-sm font-medium text-gray-300">F95 Game Launcher</div>
      <div className="flex space-x-2 no-drag">
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center hover:bg-red-600 rounded"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
