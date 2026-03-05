import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface OMSBConfig {
  llm: {
    provider: string;
    model: string;
    apiKey: string;
  };
  dataDir: string;
  webPort: number;
}

export function loadConfig(): OMSBConfig {
  const configPath = join(process.cwd(), 'omsb.config.json');

  if (!existsSync(configPath)) {
    console.error('No omsb.config.json found. Run "omsb init" first.');
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  if (config.llm?.apiKey) {
    config.llm.apiKey = config.llm.apiKey.replace(
      /\$\{(\w+)\}/g,
      (_: string, key: string) => process.env[key] || '',
    );
  }

  return config;
}
