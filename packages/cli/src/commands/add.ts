import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { QuizGenerator, parseNote, CardStore, createNewCard } from '@omsb/core';
import { loadConfig } from '../utils/config.js';

export const addCommand = new Command('add')
  .description('Import a note and generate flashcards')
  .argument('<file>', 'Markdown file to import')
  .option('-t, --types <types>', 'Card types to generate (basic,cloze,mcq,explain)', 'basic,cloze,mcq')
  .option('-n, --max <number>', 'Maximum cards to generate', '10')
  .action(async (file: string, options) => {
    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.error(chalk.red(`File not found: ${filePath}`));
      process.exit(1);
    }

    const config = loadConfig();
    const spinner = ora('Parsing note...').start();

    try {
      const note = parseNote(filePath);
      spinner.text = 'Generating flashcards with AI...';

      const generator = new QuizGenerator({
        provider: config.llm.provider as 'anthropic' | 'openai',
        model: config.llm.model,
        apiKey: config.llm.apiKey.replace('${ANTHROPIC_API_KEY}', process.env.ANTHROPIC_API_KEY || ''),
        maxCardsPerNote: parseInt(options.max),
      });

      const types = options.types.split(',');
      const cards = await generator.generateCards(note, types);

      spinner.text = 'Saving cards...';
      const store = new CardStore(config.dataDir);

      let count = 0;
      for (const generated of cards) {
        const card = createNewCard(
          crypto.randomUUID(),
          filePath,
          generated.type,
          generated.front,
          generated.back,
          [...note.tags, ...generated.tags],
        );
        store.saveCard(card);
        count++;
      }

      spinner.succeed(chalk.green(`Generated ${count} flashcards from "${note.title}"`));

      console.log('\n  Card breakdown:');
      const typeCounts = cards.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      for (const [type, cnt] of Object.entries(typeCounts)) {
        console.log(`    ${chalk.cyan(type)}: ${cnt}`);
      }
      console.log(`\n  Run ${chalk.cyan('omsb review')} to start studying!`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate cards'));
      console.error(error);
      process.exit(1);
    }
  });
