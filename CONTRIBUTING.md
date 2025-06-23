# Contributing to F95 Game Launcher

Thank you for your interest in contributing to F95 Game Launcher! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Basic knowledge of TypeScript, React, and Electron

### Development Setup
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/F95-Launcher.git
   cd F95-Launcher
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic

### Project Structure
```
src/
├── main/           # Electron main process
│   ├── api/        # F95Zone API integration
│   ├── auth/       # Authentication management
│   ├── library/    # Game library management
│   └── utils/      # Utilities and helpers
├── renderer/       # React frontend
│   ├── components/ # React components
│   └── App.tsx     # Main app component
└── shared/         # Shared types and utilities
```

### Commit Messages
Use clear, descriptive commit messages:
- `feat: add new feature`
- `fix: resolve specific bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code improvements`
- `test: add or update tests`

## Types of Contributions

### Bug Reports
Before submitting a bug report:
1. Check existing issues to avoid duplicates
2. Test with the latest version
3. Provide detailed reproduction steps
4. Include system information and logs

### Feature Requests
When requesting features:
1. Explain the use case and benefits
2. Consider implementation complexity
3. Discuss potential alternatives
4. Check if it aligns with project goals

### Code Contributions
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following the guidelines
3. Test your changes thoroughly
4. Update documentation if needed
5. Submit a pull request

## Pull Request Process

1. **Fork and Branch**: Create a feature branch from `main`
2. **Develop**: Make your changes following our guidelines
3. **Test**: Ensure all functionality works correctly
4. **Document**: Update README or docs if needed
5. **Submit**: Open a pull request with a clear description

### Pull Request Guidelines
- Provide a clear title and description
- Reference related issues
- Include screenshots for UI changes
- Ensure code passes linting and builds successfully
- Keep changes focused and atomic

## Building and Testing

### Development Commands
```bash
# Start development mode
npm run dev

# Build for production
npm run build

# Build distribution packages
npm run dist:linux    # Linux packages
npm run dist:win      # Windows packages
npm run dist:all      # All platforms
```

### Testing
- Test your changes on the target platform
- Verify both online and offline modes work
- Check F95Zone integration functionality
- Ensure no regressions in existing features

## Security Considerations

- Never commit credentials or API keys
- Follow secure coding practices
- Be mindful of user privacy and data handling
- Report security issues privately

## Getting Help

- **Questions**: Open a GitHub issue with the "question" label
- **Discussions**: Use GitHub Discussions for general topics
- **Documentation**: Check the project README and wiki

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professionalism

### Unacceptable Behavior
- Harassment or discrimination
- Spam or off-topic content
- Sharing inappropriate material
- Violating platform terms of service

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

## Legal

By contributing, you agree that:
- Your contributions will be licensed under the MIT License
- You have the right to submit the contribution
- Your contribution is your original work

Thank you for contributing to F95 Game Launcher!