import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../utils/config.js';

export const serveCommand = new Command('serve')
  .description('Start the web dashboard')
  .option('-p, --port <number>', 'Port number')
  .action(async (options) => {
    const config = loadConfig();
    const port = options.port || config.webPort || 3777;

    console.log(chalk.cyan(`\n  Starting OMSB Web Dashboard...`));
    console.log(`  ${chalk.green('Ready')} at ${chalk.bold(`http://localhost:${port}`)}\n`);

    // Launch Next.js dev server
    const { spawn } = await import('child_process');
    const child = spawn('npx', ['next', 'dev', '-p', String(port)], {
      cwd: new URL('../../..', import.meta.url).pathname + '/web',
      stdio: 'inherit',
      env: { ...process.env, OMSB_DATA_DIR: config.dataDir },
    });

    child.on('error', (err) => {
      console.error(chalk.red('Failed to start web dashboard:'), err.message);
      process.exit(1);
    });
  });
