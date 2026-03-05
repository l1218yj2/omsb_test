import { NextResponse } from 'next/server';
import { CardStore, scheduleCard } from '@omsb/core';
import type { Rating } from '@omsb/core';
import { join } from 'path';

function getDataDir() { return process.env.OMSB_DATA_DIR || join(process.cwd(), '../../data'); }

export async function POST(request: Request) {
  try {
    const { cardId, rating } = await request.json();
    const store = new CardStore(getDataDir());
    const card = store.loadCard(cardId);
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    const result = scheduleCard(card, rating as Rating);
    store.saveCard(result.card);
    store.saveReviewLog(result.reviewLog);
    return NextResponse.json({ success: true, nextDue: result.card.due });
  } catch { return NextResponse.json({ error: 'Review failed' }, { status: 500 }); }
}
