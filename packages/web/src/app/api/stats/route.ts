import { NextResponse } from 'next/server';
import { CardStore } from '@omsb/core';
import { join } from 'path';

function getDataDir() {
  return process.env.OMSB_DATA_DIR || join(process.cwd(), '../../data');
}

export async function GET() {
  try {
    const store = new CardStore(getDataDir());
    const cards = store.loadAllCards();
    const logs = store.loadReviewLogs();
    const now = new Date();
    const dueCount = cards.filter(c => new Date(c.due) <= now).length;
    const states = { new: 0, learning: 0, review: 0, relearning: 0 };
    for (const c of cards) states[c.state as keyof typeof states]++;
    const correctLogs = logs.filter(l => l.rating >= 3);
    const successRate = logs.length ? Math.round((correctLogs.length / logs.length) * 100) : 0;
    let streak = 0;
    const d = new Date();
    const reviewDates = new Set(logs.map(l => new Date(l.reviewedAt).toDateString()));
    while (reviewDates.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    const recentReviews: { date: string; count: number; correct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayLogs = logs.filter(l => new Date(l.reviewedAt).toDateString() === dateStr);
      recentReviews.push({ date: date.toLocaleDateString('en', { weekday: 'short' }), count: dayLogs.length, correct: dayLogs.filter(l => l.rating >= 3).length });
    }
    return NextResponse.json({ totalCards: cards.length, dueCount, reviewsToday: logs.filter(l => new Date(l.reviewedAt).toDateString() === now.toDateString()).length, streak, successRate, states, recentReviews });
  } catch { return NextResponse.json({ totalCards: 0, dueCount: 0, reviewsToday: 0, streak: 0, successRate: 0, states: { new: 0, learning: 0, review: 0, relearning: 0 }, recentReviews: [] }); }
}
