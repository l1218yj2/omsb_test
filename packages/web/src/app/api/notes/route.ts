import { NextResponse } from 'next/server';
import { CardStore } from '@omsb/core';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

function getDataDir() { return process.env.OMSB_DATA_DIR || join(process.cwd(), '../../data'); }

export async function GET() {
  try {
    const dataDir = getDataDir();
    const notesDir = join(dataDir, 'notes');
    if (!existsSync(notesDir)) return NextResponse.json([]);
    const store = new CardStore(dataDir);
    const cards = store.loadAllCards();
    const files = readdirSync(notesDir).filter(f => f.endsWith('.md'));
    return NextResponse.json(files.map(name => ({ name: name.replace('.md', ''), cardCount: cards.filter(c => c.noteSource.includes(name.replace('.md', ''))).length })));
  } catch { return NextResponse.json([]); }
}
