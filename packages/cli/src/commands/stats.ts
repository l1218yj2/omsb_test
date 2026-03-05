import { Command } from 'commander';
import chalk from 'chalk';
import { CardStore } from '@omsb/core';
import { loadConfig } from '../utils/config.js';

export const statsCommand = new Command('stats')
  .description('Show learning statistics')
  .action(async () => {
    const config = loadConfig();
    const store = new CardStore(config.dataDir);
    const cards = store.loadAllCards();
    const logs = store.loadReviewLogs();

    console.log(chalk.cyan('\n  OMSB Learning Statistics\n'));
    console.log(`  Total Cards: ${chalk.bold(String(cards.length))}`);

    const states: Record<string, number> = { new: 0, learning: 0, review: 0, relearning: 0 };
    for (const card of cards) {
      states[card.state] = (states[card.state] || 0) + 1;
    }
    console.log(`  New: ${states.new} | Learning: ${states.learning} | Review: ${states.review} | Relearning: ${states.relearning}`);

    const now = new Date();
    const due = cards.filter(c => new Date(c.due) <= now).length;
    console.log(`  Due Now: ${chalk.yellow(String(due))}`);

    console.log(`\n  Total Reviews: ${chalk.bold(String(logs.length))}`);

    if (logs.length > 0) {
      const ratings: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const log of logs) {
        ratings[log.rating] = (ratings[log.rating] || 0) + 1;
      }
      const correctRate = ((ratings[3] + ratings[4]) / logs.length * 100).toFixed(1);
      console.log(`  Success Rate: ${chalk.green(correctRate + '%')}`);
      console.log(`  Again: ${ratings[1]} | Hard: ${ratings[2]} | Good: ${ratings[3]} | Easy: ${ratings[4]}`);

      // Streak calculation
      const today = new Date().toDateString();
      const reviewDates = [...new Set(logs.map((l: { reviewedAt: Date }) => new Date(l.reviewedAt).toDateString()))].sort();
      let streak = 0;
      const d = new Date();
      while (reviewDates.includes(d.toDateString())) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      console.log(`  Current Streak: ${chalk.bold(String(streak))} days`);
    }

    console.log('');
  });
