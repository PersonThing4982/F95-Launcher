# F95 Game Launcher v1.0.0 - Release Notes

## 🎉 Initial Release

A complete game launcher and library manager with F95Zone integration for Linux and Windows.

## ✨ Key Features

### Game Management
- **Local Library**: Organize and manage your game collection
- **Game Launching**: Launch games directly from the launcher
- **Metadata Sync**: Automatically fetch game information from F95Zone
- **Manual Linking**: Manually associate F95Zone threads with games
- **Favorites System**: Mark and filter favorite games
- **Play Time Tracking**: Track time spent in games

### F95Zone Integration
- **Game Discovery**: Search and browse F95Zone games
- **Metadata Fetching**: Ratings, tags, developer info, versions
- **Update Notifications**: Get notified when games have new versions
- **Thread Links**: Direct links to F95Zone discussion threads
- **Category Filtering**: Filter by game status, tags, and categories

### User Experience
- **Offline Mode**: Use local library without F95Zone login
- **Clean Interface**: Modern, responsive design with dark theme
- **Cross-Platform**: Identical experience on Linux and Windows
- **No Downloads**: Launcher only manages and launches - no downloading
- **Privacy Focused**: Only connects to F95Zone when needed

### Technical Features
- **Native Performance**: Built with Electron for optimal performance
- **Secure**: Context isolation and secure preload scripts
- **Local Storage**: All data stored locally with electron-store
- **Error Handling**: Comprehensive error handling and logging
- **Update Detection**: Smart version comparison for game updates

## 📦 Distribution Packages

### Linux
- **f95-game-launcher_1.0.0_amd64.deb**: Debian package for Ubuntu/Debian
- **F95 Game Launcher-1.0.0.AppImage**: Portable AppImage for all Linux distros

### Windows
- **F95 Game Launcher Setup 1.0.0.exe**: Full installer with shortcuts
- **F95 Game Launcher 1.0.0.exe**: Portable version (no installation)

## 🔧 Technical Details

### Built With
- **Electron 28**: Cross-platform desktop framework
- **React 18**: Modern UI framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **F95API**: Official F95Zone API integration
- **Winston**: Comprehensive logging system

### System Requirements
- **Linux**: Ubuntu 18.04+ / Debian 10+ (x64)
- **Windows**: Windows 10+ (x64)
- **RAM**: 512MB minimum, 1GB recommended
- **Storage**: 200MB installation space

## 🛡️ Security & Privacy

- **No Data Collection**: No telemetry or analytics
- **Local Storage**: All data stored on your device
- **Secure Authentication**: F95Zone credentials handled securely
- **Optional Login**: Full offline mode available
- **No Downloads**: Launcher doesn't download game files

## 🚀 Getting Started

1. Download the appropriate package for your system
2. Install or run the application
3. Optionally sign in to F95Zone for syncing features
4. Add games to your library
5. Start organizing and launching your games!

## 📋 Known Limitations

- **Linux Only Features**: Currently optimized for Linux, Windows version is cross-compiled
- **F95Zone Dependency**: Some features require F95Zone account
- **Manual Game Addition**: Games must be manually added to library
- **No Auto-Download**: Launcher doesn't download games automatically

## 🔮 Future Plans

- Auto-game detection from common directories
- Theme customization options
- More metadata sources beyond F95Zone
- Game import/export functionality
- Enhanced filtering and sorting options

---

**Version:** 1.0.0  
**Release Date:** 2025-06-23  
**License:** MIT  
**Platform Support:** Linux (native), Windows (cross-compiled)