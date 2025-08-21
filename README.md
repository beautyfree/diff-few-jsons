# JSON Diff Timeline

A modern Next.js web application for comparing JSON files with side-by-side and unified diff views. Built with TypeScript, Tailwind CSS, and Framer Motion.

## 🌐 Live Demo

**Production URL**: https://diff-few-jsons.vercel.app

**Latest Deployment**: https://diff-few-jsons-phsul4oad-alexey-elizarovs-projects.vercel.app

## Features

- **JSON File Comparison**: Upload, paste, or fetch JSON files for comparison
- **Smart Diff Algorithm**: Intelligent field matching and alignment for reordered JSONs
- **Multiple View Modes**: Side-by-side and unified diff views
- **Modern UI**: Beautiful interface with smooth animations and dark/light themes
- **Session Management**: Save and load comparison sessions
- **Git-Style Output**: Copy diffs in git format
- **Hide Unchanged**: Option to hide unchanged fields for cleaner view
- **Privacy-First**: Local processing by default

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS Variables for theming
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Deployment**: Vercel
- **Diff Engine**: Custom smart comparison algorithm

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start

## Deployment

This project is deployed on Vercel. To deploy:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to production:
   ```bash
   vercel --prod
   ```

3. For custom domain setup, add DNS records as instructed by Vercel CLI.
```

## Project Structure

```
├── app/                    # Next.js App Router pages
├── src/
│   ├── components/         # React components
│   ├── types/             # TypeScript type definitions
│   ├── state/             # Zustand store
│   ├── engine/            # Diff computation logic
│   ├── worker/            # Web Worker integration
│   ├── i18n/              # Internationalization
│   └── styles/            # Global styles
├── e2e/                   # Playwright E2E tests
└── fixtures/              # Test data
```

## Testing

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Built-in coverage reporting

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation as needed

## License

Private project - All rights reserved
