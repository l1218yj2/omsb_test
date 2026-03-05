import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface MemoryEntry {
  key: string;
  value: string;
  category: string;
  updatedAt: Date;
}

export class MemoryStore {
  private memoryDir: string;
  private memoryFile: string;

  constructor(dataDir: string) {
    this.memoryDir = join(dataDir, 'memory');
    this.memoryFile = join(this.memoryDir, 'MEMORY.md');
    mkdirSync(this.memoryDir, { recursive: true });
  }

  load(): Map<string, MemoryEntry> {
    if (!existsSync(this.memoryFile)) return new Map();

    const content = readFileSync(this.memoryFile, 'utf-8');
    const entries = new Map<string, MemoryEntry>();
    let currentCategory = 'general';

    for (const line of content.split('\n')) {
      if (line.startsWith('## ')) {
        currentCategory = line.replace('## ', '').trim();
      } else if (line.startsWith('- **')) {
        const match = line.match(/^- \*\*(.+?)\*\*: (.+)$/);
        if (match) {
          entries.set(match[1], {
            key: match[1],
            value: match[2],
            category: currentCategory,
            updatedAt: new Date(),
          });
        }
      }
    }
    return entries;
  }

  save(entries: Map<string, MemoryEntry>): void {
    const categories = new Map<string, MemoryEntry[]>();

    for (const entry of entries.values()) {
      const cat = entry.category || 'general';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(entry);
    }

    let md = '# OMSB Memory\n\n';
    for (const [category, items] of categories) {
      md += `## ${category}\n`;
      for (const item of items) {
        md += `- **${item.key}**: ${item.value}\n`;
      }
      md += '\n';
    }

    writeFileSync(this.memoryFile, md);
  }

  set(key: string, value: string, category: string = 'general'): void {
    const entries = this.load();
    entries.set(key, { key, value, category, updatedAt: new Date() });
    this.save(entries);
  }

  get(key: string): string | undefined {
    return this.load().get(key)?.value;
  }

  delete(key: string): boolean {
    const entries = this.load();
    const existed = entries.delete(key);
    if (existed) this.save(entries);
    return existed;
  }

  list(category?: string): MemoryEntry[] {
    const entries = Array.from(this.load().values());
    return category
      ? entries.filter((e) => e.category === category)
      : entries;
  }
}
