import { NextResponse } from 'next/server';
import { CardStore, getDueCards } from '@omsb/core';
import { join } from 'path';

function getDataDir() { return process.env.OMSB_DATA_DIR || join(process.cwd(), '../../data'); }

export async function GET() {
  try {
    const store = new CardStore(getDataDir());
    const due = getDueCards(store.loadAllCards());
    return NextResponse.json(due.slice(0, 20));
  } catch { return NextResponse.json([]); }
}
