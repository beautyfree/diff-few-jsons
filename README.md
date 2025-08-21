# Diff Few JSONs Online

A modern Next.js web application for comparing JSON files with side-by-side and unified diff views. Built with TypeScript, Tailwind CSS, and Framer Motion.

## 🌐 Live Demo

**Production URL**: https://diff-few-jsons.vercel.app

**GitHub Repository**: https://github.com/beautyfree/diff-few-jsons

## ✨ Features

- **Smart JSON Comparison**: Intelligent field matching and alignment for reordered JSONs
- **Multiple View Modes**: Side-by-side and unified diff views with smooth transitions
- **Modern UI/UX**: Beautiful interface with dark/light themes and animations
- **Session Management**: Save and load comparison sessions locally
- **Git-Style Output**: Copy diffs in git format for easy sharing
- **Hide Unchanged**: Option to hide unchanged fields for cleaner view
- **File Upload**: Drag & drop, paste, or upload JSON files
- **Privacy-First**: All processing happens locally in your browser

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS Variables for dynamic theming
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Deployment**: Vercel
- **Diff Engine**: Custom smart comparison algorithm

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/beautyfree/diff-few-jsons.git
   cd diff-few-jsons
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles
├── src/
│   ├── components/        # React components
│   │   ├── UploadPanel.tsx
│   │   ├── VersionList.tsx
│   │   ├── SequentialDiffs.tsx
│   │   ├── SideBySideDiff.tsx
│   │   ├── UnifiedDiff.tsx
│   │   ├── SessionBar.tsx
│   │   ├── CopyButton.tsx
│   │   └── NotificationContainer.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── domain.ts
│   ├── state/            # Zustand store
│   │   └── store.ts
│   └── styles/           # Global styles and themes
│       └── theme.css
├── public/               # Static assets
├── robots.txt           # SEO robots file
├── sitemap.xml          # SEO sitemap
└── vercel.json          # Vercel deployment config
```

## 🎯 Key Components

### Smart Diff Algorithm
The application uses a custom smart comparison algorithm that:
- Finds exact matches between JSON fields
- Identifies modified fields (same name, different value)
- Handles reordered fields intelligently
- Maintains proper line numbering
- Sorts fields to align with the second JSON structure

### Session Management
- Save comparison sessions locally
- Load previously saved sessions
- Clear sessions with confirmation
- Export session data

### Theme System
- Dark and light themes
- CSS variables for dynamic theming
- Apple-inspired color palette
- Smooth theme transitions

## 🚀 Deployment

This project is deployed on Vercel. To deploy:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to production:
   ```bash
   vercel --prod
   ```

## 📝 Usage

1. **Upload JSON Files**: Drag & drop, paste, or upload JSON files
2. **Compare**: View differences in side-by-side or unified mode
3. **Customize**: Toggle "Hide unchanged" and switch view modes
4. **Copy**: Copy diffs in git format for sharing
5. **Save**: Save your session for later use

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- Animated with Framer Motion
- Deployed on Vercel
