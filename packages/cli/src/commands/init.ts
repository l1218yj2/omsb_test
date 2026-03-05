import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export const initCommand = new Command('init')
  .description('Initialize OMSB in the current directory')
  .action(async () => {
    const cwd = process.cwd();
    const configPath = join(cwd, 'omsb.config.json');

    if (existsSync(configPath)) {
      console.log(chalk.yellow('OMSB is already initialized in this directory.'));
      return;
    }

    // Create directories
    const dirs = ['data/notes', 'data/cards', 'data/reviews', 'data/memory'];
    for (const dir of dirs) {
      mkdirSync(join(cwd, dir), { recursive: true });
    }

    // Create config
    const config = {
      llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5-20250514',
        apiKey: '${ANTHROPIC_API_KEY}',
      },
      dataDir: './data',
      webPort: 3777,
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Create sample note
    const sampleNote = `---
title: Welcome to OMSB
tags: [getting-started]
---

# Welcome to Oh My Second Brain

OMSB helps you learn and remember using AI-powered spaced repetition.

## How It Works

1. **Add notes** - Write or import Markdown notes
2. **Generate cards** - AI creates flashcards and quizzes from your notes
3. **Review** - Practice with spaced repetition scheduling
4. **Track progress** - See your learning stats on the dashboard

## Key Concepts

### Spaced Repetition
Spaced repetition is a learning technique where you review material at increasing intervals. OMSB uses the FSRS-5 algorithm to optimize review timing.

### Active Recall
Instead of passively re-reading, OMSB tests you with flashcards and quizzes to strengthen memory.

### The Forgetting Curve
Without review, you forget ~80% within a week. Spaced repetition fights this by reviewing just before you forget.
`;
    writeFileSync(join(cwd, 'data/notes/welcome.md'), sampleNote);

    console.log(chalk.green('\n  OMSB initialized successfully!\n'));
    console.log('  Next steps:');
    console.log(`  ${chalk.cyan('omsb add data/notes/welcome.md')}  - Generate cards from the sample note`);
    console.log(`  ${chalk.cyan('omsb review')}                     - Review due flashcards`);
    console.log(`  ${chalk.cyan('omsb serve')}                      - Start web dashboard`);
    console.log('');
  });
