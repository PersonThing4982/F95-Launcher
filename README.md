# F95 Game Launcher

<div align="center">

![F95 Game Launcher](assets/icon.png)

**A modern desktop game launcher with F95Zone integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-v28-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org/)

[Download](#download) • [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Development](#development)

</div>

## Overview

F95 Game Launcher is a modern, cross-platform desktop application that helps you organize, manage, and launch your game collection. With optional F95Zone integration, you can discover new games, sync metadata, and keep track of updates.
![image](https://github.com/user-attachments/assets/3a36733e-aa59-4b01-a025-e44121d2610b)
![image](https://github.com/user-attachments/assets/492269cf-552d-4f42-8d9b-7ddbf8476c87)

![image](https://github.com/user-attachments/assets/dbbaab1d-4de8-4e35-8622-03c7f45245cc)

## Features

### 🎮 **Game Management**

- **Local Library**: Organize your entire game collection in one place
- **Game Launching**: Launch games directly from the launcher
- **Favorites System**: Mark and filter your favorite games
- **Play Time Tracking**: Track time spent in each game
- **Folder Management**: Organize games and open game directories

### 🌐 **F95Zone Integration**

- **Game Discovery**: Search and browse F95Zone's extensive catalog
- **Metadata Sync**: Auto-fetch ratings, tags, developer info, and descriptions
- **Update Notifications**: Get notified when your games have new versions
- **Manual Linking**: Associate F95Zone threads with your local games
- **Direct Links**: Quick access to F95Zone discussion threads

### 🖥️ **User Experience**

- **Offline Mode**: Full local library access without F95Zone login
- **Modern UI**: Clean, dark theme with responsive design
- **Cross-Platform**: Identical experience on Linux and Windows
- **Fast Performance**: Built with Electron and React for optimal speed
- **Privacy Focused**: All data stored locally, no telemetry

### 🔒 **Security & Privacy**

- **Local Storage**: All data stored on your device using electron-store
- **No Telemetry**: Zero data collection or analytics
- **Secure Authentication**: F95Zone credentials handled securely
- **Optional Login**: Full offline functionality available

## Download

### Linux

| Package Type      | Description                         | Download                                                                             |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| **Debian (.deb)** | For Ubuntu, Debian, and derivatives | [🐧 Latest Release](https://github.com/PersonThing4982/F95-Launcher/releases/latest) |
| **AppImage**      | Universal Linux portable            | [🐧 Latest Release](https://github.com/PersonThing4982/F95-Launcher/releases/latest) |

### Windows

| Package Type         | Description               | Download                                                                             |
| -------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| **Installer (.exe)** | Full Windows installation | [🪟 Latest Release](https://github.com/PersonThing4982/F95-Launcher/releases/latest) |
| **Portable (.exe)**  | No installation required  | [🪟 Latest Release](https://github.com/PersonThing4982/F95-Launcher/releases/latest) |

### System Requirements

- **Linux**: Ubuntu 18.04+ / Debian 10+ (x64)
- **Windows**: Windows 10+ (x64)
- **RAM**: 512MB minimum, 1GB recommended
- **Storage**: 200MB installation space

## Installation

### Linux

1. **Go to [🐧 Latest Release](https://github.com/PersonThing4982/F95-Launcher/releases/latest)**
2. **Download your preferred package:**
   - `.deb` for Ubuntu/Debian: `sudo dpkg -i f95-game-launcher_1.0.0_amd64.deb`
   - `AppImage` for universal Linux: `chmod +x F95GameLauncher-1.0.0.AppImage && ./F95GameLauncher-1.0.0.AppImage`
3. **Launch from terminal:** `F95` or from applications menu

### Windows

1. **Go to [🪟 Latest Release](https://github.com/PersonThing4982/F95-Launcher/releases/latest)**
2. **Download your preferred version:**
   - `Setup.exe` for full installation with shortcuts
   - `Portable.exe` for no-install version
3. **Run the installer** or portable executable
4. **Launch** from Start Menu, Desktop, or directly

**📋 Detailed installation guides are included in each release page.**

## Usage

### Quick Start

1. **Launch the application**
2. **Sign in to F95Zone** (optional - enables syncing features)
   - Or use **Offline Mode** for local games only
3. **Add games to your library**
   - Browse local games or search F95Zone
4. **Organize and launch** your games

### Key Features

#### Adding Games

- **From F95Zone**: Search and add games directly from F95Zone
- **Local Games**: Add games already installed on your system
- **Manual Linking**: Associate F95Zone threads with local games

#### Library Management

- **Play Games**: Launch games directly from the launcher
- **Organize**: Mark favorites, track play time
- **Update Tracking**: Get notified of new game versions
- **Folder Access**: Quick access to game directories

#### Offline Mode

- Access your local game library without F95Zone login
- Perfect for privacy or offline gaming
- All local features remain available

## Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/PersonThing4982/F95-Launcher.git
cd F95-Launcher

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build Commands

```bash
# Build for development
npm run build

# Build Linux packages
npm run dist:linux

# Build Windows packages
npm run dist:win

# Build all platforms
npm run dist:all
```

### Tech Stack

- **Framework**: Electron 28
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **API**: F95API (@millenniumearl/f95api)
- **Storage**: electron-store
- **Logging**: Winston
- **Build**: Vite + electron-builder

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application is not affiliated with or endorsed by F95Zone. It's an independent tool that uses F95Zone's public API for game metadata and discovery. Please respect F95Zone's terms of service when using this application.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/PersonThing4982/F95-Launcher/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/PersonThing4982/F95-Launcher/issues)
- 📖 **Documentation**: [Wiki](https://github.com/PersonThing4982/F95-Launcher/wiki)

---

<div align="center">

Made with ❤️ by the F95 Launcher community

[⭐ Star this project](https://github.com/PersonThing4982/F95-Launcher) if you find it useful!

</div>
