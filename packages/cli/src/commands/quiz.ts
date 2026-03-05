import { Command } from 'commander';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { QuizGenerator, parseNote } from '@omsb/core';
import { loadConfig } from '../utils/config.js';
import { resolve } from 'path';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export const quizCommand = new Command('quiz')
  .description('Take a quiz on your notes')
  .argument('[topic]', 'Topic or note file to quiz on')
  .option('-n, --count <number>', 'Number of questions', '5')
  .action(async (topic: string | undefined, options) => {
    const config = loadConfig();
    const notesDir = join(config.dataDir, 'notes');

    let notePath: string;
    if (topic && existsSync(resolve(topic))) {
      notePath = resolve(topic);
    } else {
      // Find a note matching the topic
      if (!existsSync(notesDir)) {
        console.error(chalk.red('No notes found. Run omsb add first.'));
        process.exit(1);
      }
      const files = readdirSync(notesDir).filter(f => f.endsWith('.md'));
      if (topic) {
        const match = files.find(f => f.toLowerCase().includes(topic.toLowerCase()));
        if (!match) {
          console.error(chalk.red(`No note matching "${topic}" found.`));
          process.exit(1);
        }
        notePath = join(notesDir, match);
      } else {
        // Pick random note
        notePath = join(notesDir, files[Math.floor(Math.random() * files.length)]);
      }
    }

    const note = parseNote(notePath);
    console.log(chalk.cyan(`\n  Quiz: ${note.title}\n`));

    const generator = new QuizGenerator({
      provider: config.llm.provider as 'anthropic' | 'openai',
      model: config.llm.model,
      apiKey: config.llm.apiKey.replace('${ANTHROPIC_API_KEY}', process.env.ANTHROPIC_API_KEY || ''),
    });

    const questions = await generator.generateQuiz(note, parseInt(options.count));
    if (questions.length === 0) {
      console.log(chalk.yellow('Could not generate quiz questions.'));
      return;
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(chalk.bold(`  Q${i + 1}. ${q.question}`));

      if (q.type === 'mcq' && q.options) {
        q.options.forEach((opt, j) => {
          console.log(`    ${chalk.cyan(String.fromCharCode(65 + j))}. ${opt}`);
        });
        const ans = await ask('\n  Your answer (A/B/C/D): ');
        const ansIdx = ans.toUpperCase().charCodeAt(0) - 65;
        if (q.options[ansIdx] === q.correctAnswer) {
          console.log(chalk.green('  Correct!'));
          score++;
        } else {
          console.log(chalk.red(`  Wrong. Answer: ${q.correctAnswer}`));
        }
      } else {
        const ans = await ask('\n  Your answer: ');
        console.log(chalk.blue(`  Expected: ${q.correctAnswer}`));
        const self = await ask(`  Were you correct? ${chalk.green('[y]')}/${chalk.red('[n]')}: `);
        if (self.toLowerCase() === 'y') score++;
      }

      if (q.explanation) {
        console.log(chalk.dim(`  Explanation: ${q.explanation}`));
      }
      console.log('');
    }

    rl.close();
    console.log(chalk.bold(`\n  Score: ${score}/${questions.length} (${Math.round(score/questions.length*100)}%)\n`));
  });
