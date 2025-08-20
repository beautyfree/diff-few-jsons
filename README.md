# JSON Diff Timeline

A modern Next.js web application for visualizing JSON differences over time with an interactive timeline. Built with TypeScript, Tailwind CSS, and Framer Motion.

## Features

- **Multi-JSON Ingestion**: Upload, paste, or fetch JSON files
- **Timeline Visualization**: Scrub through versions to see changes evolve
- **Diff Engine**: Accurate comparison of objects, arrays, and primitives
- **Modern UI**: Beautiful interface with smooth animations
- **Performance**: Web Workers for heavy computation, virtualization for large trees
- **Privacy-First**: Local processing by default

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Testing**: Vitest, React Testing Library, Playwright
- **Diff Engine**: jsondiffpatch + custom adapters

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
