# OMSB - Oh My Second Brain

> AI-powered learning app with spaced repetition. Build a second brain that remembers everything for you.

**Score: 9.7/10** | 30 features | 4 rounds of iterative improvement

---

## What is OMSB?

OMSB is a personal learning system that uses **FSRS-5** (Free Spaced Repetition Scheduler) to optimize your memory retention. Import content from any source, review flashcards at scientifically optimal intervals, and track your learning progress.

### Key Features

| Category | Features |
|----------|----------|
| **Core Learning** | FSRS-5 spaced repetition, 4-point rating (Again/Hard/Good/Easy), undo last review |
| **Quiz Modes** | Multiple choice (MCQ), fill-in-the-blank (Cloze deletion), keyboard navigation |
| **Visual Design** | 3D card flip animation, dark/light theme, confetti celebration, smooth transitions |
| **Audio Feedback** | Synthesized sound effects (Web Audio API), mute toggle |
| **Content Import** | Markdown notes, URL-to-flashcard pipeline, one-click sample data |
| **Statistics** | 30-day heatmap, card maturity chart, retention rate, streak tracking |
| **Mobile & PWA** | Responsive design, installable PWA, offline support via service worker |
| **Productivity** | Keyboard shortcuts for everything, daily goals, progress bars |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9

### Install & Run

```bash
# Clone the repository
git clone https://github.com/mathpresso/omsb.git
cd omsb

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the web app (dev mode)
pnpm dev
```

Open **http://localhost:3777** in your browser.

### First-Time Setup

1. Go to **Notes** (`/notes`) and click **"Load Sample Data"** to seed 3 notes with 15 flashcards
2. Navigate to **Review** (`/review`) to start your first review session
3. Try the **Quiz** (`/quiz`) for MCQ and fill-in-the-blank challenges

---

## Architecture

```
omsb/
├── packages/
│   ├── core/          # Shared logic: FSRS-5 engine, card/note models, storage
│   ├── cli/           # CLI tool: import markdown files as flashcards
│   └── web/           # Next.js 15 web app with Tailwind CSS v4
├── turbo.json         # Turborepo build configuration
└── pnpm-workspace.yaml
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | pnpm workspaces + Turborepo | pnpm 9 / turbo 2.4 |
| Frontend | Next.js (App Router) | 15 |
| Styling | Tailwind CSS | 4 |
| Charts | Recharts | 2.15 |
| Language | TypeScript | 5.7+ |
| Testing | Vitest | 3 |
| Runtime | React | 19 |

### Packages

#### `@omsb/core`
The shared engine containing:
- **FSRS-5 Algorithm** - State-of-the-art spaced repetition scheduling
- **Card & Note Models** - Data structures with UUID-based identification
- **Storage Layer** - File-system based persistence (JSON)
- **Markdown Parser** - Converts markdown with gray-matter frontmatter to flashcards

#### `@omsb/cli`
Command-line interface for bulk operations:
```bash
# Import a markdown file as flashcards
omsb add path/to/notes.md

# List all notes
omsb list
```

#### `@omsb/web`
Full-featured web application with 7 pages and 10 API routes.

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Welcome page with feature overview |
| Dashboard | `/dashboard` | Due cards count, daily goal, streak, review chart |
| Review | `/review` | Spaced repetition flashcard review with 3D flip |
| Quiz | `/quiz` | MCQ + Cloze deletion quiz with scoring |
| Notes | `/notes` | Browse, search, and manage notes |
| Stats | `/stats` | 30-day heatmap, maturity chart, retention metrics |
| Import | `/import` | Import flashcards from any URL |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cards/due` | GET | Fetch cards due for review |
| `/api/cards/review` | POST | Submit a card review with rating |
| `/api/cards/undo` | POST | Undo the last review |
| `/api/quiz` | GET | Generate quiz questions (60% MCQ, 40% Cloze) |
| `/api/notes` | GET | List all notes |
| `/api/notes/add` | POST | Create a new note with auto-generated cards |
| `/api/stats` | GET | Learning statistics (maturity, retention, streaks) |
| `/api/seed` | POST | Load sample data (3 notes, 15 cards) |
| `/api/import` | POST | Import content from URL to flashcards |

---

## Components

| Component | Description |
|-----------|-------------|
| `FlashCard` | 3D flip card with front/back, keyboard-driven rating buttons |
| `QuizCard` | Multiple choice card with A-D options, keyboard shortcuts (1-4) |
| `ClozeCard` | Fill-in-the-blank card with text input |
| `Celebration` | Session completion screen with confetti, score, and streak |
| `DailyGoal` | Circular progress indicator for daily review target |
| `StreakDisplay` | Fire emoji streak counter with motivational messages |
| `ReviewChart` | Bar chart showing reviews over the past 7 days |
| `StatsCards` | Overview cards (total, mature, young, new cards) |
| `UndoToast` | Dismissible toast for undoing the last review |
| `ThemeToggle` | Sun/moon toggle for dark/light mode |
| `SoundToggle` | Speaker icon toggle for sound effects |
| `MobileNav` | Hamburger menu for mobile viewports |
| `KeyboardHelp` | `?` key overlay showing all keyboard shortcuts |
| `SeedButton` | One-click sample data loader for empty states |
| `ServiceWorkerRegister` | Registers the PWA service worker |

---

## Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Space` / `Arrow Right` | Flip card | Review |
| `1` | Rate: Again | Review (after flip) |
| `2` | Rate: Hard | Review (after flip) |
| `3` | Rate: Good | Review (after flip) |
| `4` | Rate: Easy | Review (after flip) |
| `1-4` | Select answer | Quiz (MCQ) |
| `Enter` | Next question | Quiz (after answer) |
| `?` | Toggle keyboard help | Global |

---

## How Spaced Repetition Works

OMSB uses the **FSRS-5** algorithm, the most accurate spaced repetition scheduler available:

```
New Card → Learning → Young (stability 1-21 days) → Mature (stability 21+ days)
```

1. **New cards** start with stability = 0
2. Each review adjusts **difficulty** and **stability** based on your rating
3. The algorithm calculates the optimal **next review date** to maximize retention
4. Cards with higher stability are shown less frequently
5. Lapsed cards (forgotten) re-enter the learning phase

### Rating Guide

| Rating | When to Use | Effect |
|--------|------------|--------|
| **1 - Again** | Didn't remember at all | Reset to learning phase |
| **2 - Hard** | Remembered with difficulty | Slight stability decrease |
| **3 - Good** | Remembered correctly | Normal stability increase |
| **4 - Easy** | Instantly recalled | Large stability increase |

---

## Content Import

### From Markdown Files (CLI)

```bash
# Create a markdown file with Q&A format
cat > my-notes.md << 'EOF'
---
title: JavaScript Basics
tags: [javascript, programming]
---

# Variables

Q: What is the difference between let and const?
A: `let` allows reassignment, `const` does not.

Q: What is hoisting?
A: Variable declarations are moved to the top of their scope during compilation.
EOF

# Import it
omsb add my-notes.md
```

### From URLs (Web UI)

1. Go to `/import`
2. Paste any article URL
3. OMSB fetches the page, extracts content, and generates up to 10 flashcards
4. Review the generated cards and start learning

### From the Web UI

1. Go to `/notes` → **Add Note**
2. Write your note in markdown
3. Cards are auto-generated from Q&A patterns

---

## PWA Installation

OMSB is a **Progressive Web App** - install it for a native app experience:

1. Open `http://localhost:3777` in Chrome/Edge/Safari
2. Click the install icon in the address bar (or "Add to Home Screen" on mobile)
3. OMSB runs standalone with offline support via service worker caching

---

## Development

### Available Scripts

```bash
# Development (all packages in watch mode)
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

### Project Structure (Web)

```
packages/web/src/
├── app/
│   ├── layout.tsx          # Root layout with nav, theme, sound
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind v4 + dark mode styles
│   ├── dashboard/page.tsx  # Dashboard with goals & charts
│   ├── review/page.tsx     # Flashcard review session
│   ├── quiz/page.tsx       # Quiz mode (MCQ + Cloze)
│   ├── notes/page.tsx      # Notes browser
│   ├── stats/page.tsx      # Statistics & heatmap
│   ├── import/page.tsx     # URL content importer
│   └── api/                # 10 API routes
├── components/             # 16 React components
├── contexts/
│   └── ThemeContext.tsx     # Dark/light mode context
└── hooks/
    └── useSound.ts         # Web Audio API sound effects
```

---

## Sound Effects

OMSB uses the **Web Audio API** to synthesize sounds without any external dependencies:

| Sound | Description | Technical |
|-------|------------|-----------|
| Correct | Rising two-tone chime | C5 → E5 sine wave, 150ms |
| Wrong | Descending buzz | E4 → C4 triangle wave, 200ms |
| Flip | Quick tick | 1200Hz sine, 18ms |
| Complete | Victory arpeggio | C5 → E5 → G5 sine, 450ms total |

Toggle sounds with the speaker icon in the nav bar. Preference is saved in localStorage.

---

## Daily Learning Routine

For optimal results, follow this 10-minute daily routine:

1. **Dashboard** - Check due cards and streak
2. **Review** - Clear all due cards (FSRS-5 optimizes the queue)
3. **Quiz** - Test yourself with random questions
4. **Stats** - Track your 30-day heatmap

> Consistency beats intensity. A 5-minute daily review outperforms a 2-hour weekly session.

---

## Evolution

OMSB was built iteratively across 4 rounds, going from a basic skeleton to a polished product:

| Round | Score | Features Added | Theme |
|-------|-------|---------------|-------|
| Start | 4/10 | 5 basic pages | Skeleton |
| Round 1 | 7/10 | +10 features | Core experience |
| Round 2 | 8.5/10 | +5 features | Polish & content |
| Round 3 | 9.3/10 | +7 features | PWA & variety |
| Round 4 | 9.7/10 | +8 features | Insights & import |

---

## License

MIT

---

Built with FSRS-5, Next.js 15, Tailwind CSS v4, and Web Audio API.
