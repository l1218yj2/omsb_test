import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import type { Card, ReviewLog } from './types.js';

export class CardStore {
  private cardsDir: string;
  private reviewsDir: string;

  constructor(dataDir: string) {
    this.cardsDir = join(dataDir, 'cards');
    this.reviewsDir = join(dataDir, 'reviews');
    mkdirSync(this.cardsDir, { recursive: true });
    mkdirSync(this.reviewsDir, { recursive: true });
  }

  saveCard(card: Card): void {
    const filePath = join(this.cardsDir, `${card.id}.json`);
    writeFileSync(filePath, JSON.stringify(card, null, 2));
  }

  loadCard(id: string): Card | null {
    const filePath = join(this.cardsDir, `${id}.json`);
    if (!existsSync(filePath)) return null;
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    data.created = new Date(data.created);
    data.due = new Date(data.due);
    if (data.lastReview) data.lastReview = new Date(data.lastReview);
    return data as Card;
  }

  loadAllCards(): Card[] {
    if (!existsSync(this.cardsDir)) return [];
    return readdirSync(this.cardsDir)
      .filter((f: string) => f.endsWith('.json'))
      .map((f: string) => this.loadCard(f.replace('.json', '')))
      .filter((c): c is Card => c !== null);
  }

  saveReviewLog(log: ReviewLog): void {
    const logsFile = join(this.reviewsDir, `${log.cardId}.jsonl`);
    const line = JSON.stringify(log) + '\n';
    appendFileSync(logsFile, line);
  }

  loadReviewLogs(cardId?: string): ReviewLog[] {
    if (!existsSync(this.reviewsDir)) return [];
    const files = cardId
      ? [`${cardId}.jsonl`]
      : readdirSync(this.reviewsDir).filter((f: string) => f.endsWith('.jsonl'));

    const logs: ReviewLog[] = [];
    for (const file of files) {
      const filePath = join(this.reviewsDir, file);
      if (!existsSync(filePath)) continue;
      const content = readFileSync(filePath, 'utf-8');
      for (const line of content.split('\n').filter(Boolean)) {
        const log = JSON.parse(line);
        log.reviewedAt = new Date(log.reviewedAt);
        logs.push(log);
      }
    }
    return logs;
  }
}
