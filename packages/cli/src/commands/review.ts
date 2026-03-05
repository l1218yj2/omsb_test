import { Command } from 'commander';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { CardStore, getDueCards, scheduleCard } from '@omsb/core';
import type { Rating } from '@omsb/core';
import { loadConfig } from '../utils/config.js';

export const reviewCommand = new Command('review')
  .description('Review due flashcards')
  .option('-l, --limit <number>', 'Maximum cards to review', '20')
  .action(async (options) => {
    const config = loadConfig();
    const store = new CardStore(config.dataDir);
    const allCards = store.loadAllCards();
    const dueCards = getDueCards(allCards);

    if (dueCards.length === 0) {
      console.log(chalk.green('\n  No cards due for review! Great job!\n'));
      return;
    }

    const limit = Math.min(parseInt(options.limit), dueCards.length);
    console.log(chalk.cyan(`\n  ${dueCards.length} cards due. Reviewing ${limit} cards.\n`));

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

    let reviewed = 0;
    let correct = 0;

    for (let i = 0; i < limit; i++) {
      const card = dueCards[i];
      console.log(chalk.dim(`--- Card ${i + 1}/${limit} (${card.type}) ---`));
      console.log(`\n  ${chalk.bold(card.front)}\n`);

      await ask(chalk.dim('  Press Enter to show answer...'));
      console.log(`  ${chalk.green(card.back)}\n`);

      const ratingStr = await ask(
        `  Rate: ${chalk.red('[1] Again')} ${chalk.yellow('[2] Hard')} ${chalk.green('[3] Good')} ${chalk.cyan('[4] Easy')}: `
      );

      const rating = parseInt(ratingStr) as Rating;
      if (rating < 1 || rating > 4) {
        console.log(chalk.yellow('  Invalid rating, skipping...'));
        continue;
      }

      const startTime = Date.now();
      const result = scheduleCard(card, rating);
      store.saveCard(result.card);
      store.saveReviewLog(result.reviewLog);

      reviewed++;
      if (rating >= 3) correct++;

      const nextDue = result.card.due;
      const daysUntil = Math.round((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      console.log(chalk.dim(`  Next review: ${daysUntil <= 0 ? 'today' : `in ${daysUntil} days`}\n`));
    }

    rl.close();
    console.log(chalk.green(`\n  Session complete!`));
    console.log(`  Reviewed: ${reviewed} | Correct: ${correct} (${Math.round(correct/reviewed*100)}%)\n`);
  });
