#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { reviewCommand } from './commands/review.js';
import { quizCommand } from './commands/quiz.js';
import { statsCommand } from './commands/stats.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('omsb')
  .description('Oh My Second Brain - AI-powered learning with spaced repetition')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(reviewCommand);
program.addCommand(quizCommand);
program.addCommand(statsCommand);
program.addCommand(serveCommand);

program.parse();
