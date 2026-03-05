# Oh My Second Brain (OMSB) - Design Document

## Overview
OpenClaw fork optimized for learners. AI agent + learning science engine + web dashboard.

## Decisions Made
| Item | Decision |
|------|----------|
| Name | Oh My Second Brain (OMSB) |
| Base | OpenClaw fork (conceptual - build from scratch using OpenClaw architecture patterns) |
| Target | Adult self-directed learners (developers, professionals) → later K-12 students |
| Platform | CLI + Web Dashboard (no Obsidian dependency, Markdown file-based) |
| License | Private → Open after MVP validation |
| MVP Features | 1) FSRS Spaced Repetition 2) AI Quiz Generation 3) Progress Dashboard |

## Architecture

### Monorepo Structure
```
omsb/
├── packages/
│   ├── core/                 # Core engine (TypeScript)
│   │   ├── src/
│   │   │   ├── agent/        # AI agent runtime (LLM integration)
│   │   │   ├── memory/       # Markdown-based memory system (OpenClaw pattern)
│   │   │   ├── srs/          # Spaced Repetition System (FSRS algorithm)
│   │   │   ├── quiz/         # AI quiz generation from notes
│   │   │   ├── skills/       # Skill system (OpenClaw-compatible)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/                  # CLI interface
│   │   ├── src/
│   │   │   ├── commands/     # learn, review, quiz, stats, import
│   │   │   ├── repl/         # Interactive REPL
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                  # Web dashboard (Next.js)
│       ├── src/
│       │   ├── app/          # Next.js app router
│       │   │   ├── dashboard/    # Progress overview
│       │   │   ├── review/       # Flashcard review UI
│       │   │   ├── quiz/         # Quiz interface
│       │   │   └── notes/        # Note browser
│       │   ├── components/   # React components
│       │   └── lib/          # Shared utilities
│       ├── package.json
│       └── tsconfig.json
├── data/                     # User data directory (gitignored)
│   ├── notes/                # Markdown notes
│   ├── cards/                # Generated flashcards (JSON)
│   ├── reviews/              # Review history
│   └── memory/               # Agent memory (MEMORY.md pattern)
├── package.json              # Workspace root
├── turbo.json                # Turborepo config
└── tsconfig.base.json
```

### Core Components

#### 1. FSRS Spaced Repetition Engine
- Implements FSRS-5 algorithm (Free Spaced Repetition Scheduler)
- Card states: New → Learning → Review → Relearning
- Parameters: w[0..18] optimizable per user
- Stores review history in `data/reviews/` as JSON
- Key functions:
  - `scheduleCard(card, rating)` → next review date + updated parameters
  - `getDueCards(date?)` → cards due for review
  - `getStats()` → retention rate, review count, streak

#### 2. AI Quiz Generator
- Takes Markdown notes as input
- Uses LLM (Claude/GPT) to generate:
  - Flashcards (front/back)
  - Multiple choice questions
  - Fill-in-the-blank
  - Concept explanation prompts
- Difficulty calibration based on FSRS performance data
- Output format: JSON in `data/cards/`
- Deduplication: hash-based to avoid regenerating existing cards

#### 3. Progress Dashboard (Web)
- **Overview page**: Daily streak, cards due, mastery level per topic
- **Review page**: Flashcard UI with swipe/keyboard rating (Again/Hard/Good/Easy)
- **Quiz page**: Interactive quiz with immediate feedback
- **Notes page**: Browse/search notes, see linked cards
- **Stats page**: Charts - retention curve, review heatmap, topic breakdown
- Tech: Next.js 15, Tailwind CSS, Recharts, local file API

### Data Model

#### Card (flashcard)
```typescript
interface Card {
  id: string;              // uuid
  noteSource: string;      // path to source note
  type: 'basic' | 'cloze' | 'mcq' | 'explain';
  front: string;           // question/prompt
  back: string;            // answer
  tags: string[];
  created: Date;
  // FSRS state
  difficulty: number;      // [0,1]
  stability: number;       // days
  state: 'new' | 'learning' | 'review' | 'relearning';
  due: Date;
  lastReview?: Date;
  reps: number;
  lapses: number;
}
```

#### ReviewLog
```typescript
interface ReviewLog {
  cardId: string;
  rating: 1 | 2 | 3 | 4;  // Again, Hard, Good, Easy
  reviewedAt: Date;
  elapsed: number;          // ms spent
  scheduledDays: number;
  state: Card['state'];
}
```

### CLI Commands
```
omsb learn <topic>          # Start learning session with AI tutor
omsb review                 # Review due flashcards
omsb quiz [topic]           # Take a quiz
omsb add <file.md>          # Import note and generate cards
omsb stats                  # Show learning statistics
omsb serve                  # Start web dashboard (localhost:3777)
omsb init                   # Initialize OMSB in current directory
```

### LLM Integration
- Provider-agnostic: Claude, GPT, local models via OpenAI-compatible API
- Config in `omsb.config.json`:
  ```json
  {
    "llm": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-5-20250514",
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "dataDir": "./data",
    "webPort": 3777
  }
  ```

### What Makes OMSB Different from OpenClaw + Obsidian
1. **Learning science is native** - FSRS isn't a plugin, it's the core scheduler
2. **AI generates study materials** - Not just notes, but optimized flashcards/quizzes
3. **Progress is tracked scientifically** - Retention curves, not just "I read this"
4. **Zero setup for learners** - `npx omsb init` → start learning, no Obsidian needed
5. **Designed for recall, not storage** - The system's job is to help you REMEMBER, not just organize

## Implementation Phases

### Phase 1: MVP (Current)
- [ ] Project setup (monorepo, TypeScript, build)
- [ ] FSRS engine implementation
- [ ] AI card generator (Claude API)
- [ ] CLI: init, add, review, stats
- [ ] Web dashboard: review UI, basic stats

### Phase 2: Polish
- [ ] Knowledge graph visualization
- [ ] Learning journal with metacognition prompts
- [ ] Smart import (PDF, YouTube, web pages)
- [ ] Mobile-responsive web UI

### Phase 3: Social
- [ ] Shared decks
- [ ] Study groups
- [ ] Leaderboards
- [ ] QANDA app integration

## Tech Stack
- **Runtime**: Node.js 22+
- **Language**: TypeScript 5.7+
- **Build**: Turborepo
- **CLI**: Commander.js + Ink (React for CLI)
- **Web**: Next.js 15, Tailwind CSS 4, Recharts
- **LLM**: Anthropic SDK / OpenAI SDK
- **Test**: Vitest
- **Package Manager**: pnpm
