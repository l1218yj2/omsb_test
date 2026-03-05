import { describe, it, expect } from 'vitest';
import {
  createDefaultParams,
  createNewCard,
  scheduleCard,
  getDueCards,
  getRetrievability,
  getStats,
} from '../fsrs.js';
import type { Card, Rating } from '../types.js';

const params = createDefaultParams();
const NOW = new Date('2025-06-01T10:00:00Z');

function makeNewCard(id = 'test-1'): Card {
  return createNewCard(id, 'note.md', 'basic', 'What is 2+2?', '4', ['math']);
}

describe('createDefaultParams', () => {
  it('returns 19 weights', () => {
    const p = createDefaultParams();
    expect(p.w).toHaveLength(19);
    expect(p.requestRetention).toBe(0.9);
    expect(p.maximumInterval).toBe(36500);
  });

  it('returns a fresh copy each time', () => {
    const a = createDefaultParams();
    const b = createDefaultParams();
    a.w[0] = 999;
    expect(b.w[0]).not.toBe(999);
  });
});

describe('createNewCard', () => {
  it('creates a card in new state with zero stability', () => {
    const card = makeNewCard();
    expect(card.id).toBe('test-1');
    expect(card.state).toBe('new');
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.front).toBe('What is 2+2?');
    expect(card.back).toBe('4');
    expect(card.tags).toEqual(['math']);
  });
});

describe('scheduleCard - new card', () => {
  it('Again (1): moves to learning with short interval', () => {
    const card = makeNewCard();
    const { card: next, reviewLog } = scheduleCard(card, 1, NOW, params);

    expect(next.state).toBe('learning');
    expect(next.stability).toBeCloseTo(params.w[0], 4);
    expect(next.reps).toBe(1);
    expect(reviewLog.rating).toBe(1);
    expect(reviewLog.scheduledDays).toBe(0);
    // Due in ~1 minute
    expect(next.due.getTime() - NOW.getTime()).toBe(60_000);
  });

  it('Hard (2): moves to learning with 5 min interval', () => {
    const card = makeNewCard();
    const { card: next } = scheduleCard(card, 2, NOW, params);

    expect(next.state).toBe('learning');
    expect(next.stability).toBeCloseTo(params.w[1], 4);
    expect(next.due.getTime() - NOW.getTime()).toBe(5 * 60_000);
  });

  it('Good (3): moves to review with calculated interval', () => {
    const card = makeNewCard();
    const { card: next, reviewLog } = scheduleCard(card, 3, NOW, params);

    expect(next.state).toBe('review');
    expect(next.stability).toBeCloseTo(params.w[2], 4);
    expect(reviewLog.scheduledDays).toBeGreaterThanOrEqual(1);
    // Interval = S * 9 * (1/0.9 - 1) = 3.1262 * 9 * 0.1111 ≈ 3.13
    expect(reviewLog.scheduledDays).toBe(Math.round(params.w[2] * 9 * (1 / 0.9 - 1)));
  });

  it('Easy (4): moves to review with longer interval (easy bonus)', () => {
    const card = makeNewCard();
    const { card: next, reviewLog } = scheduleCard(card, 4, NOW, params);

    expect(next.state).toBe('review');
    expect(next.stability).toBeCloseTo(params.w[3], 4);
    // Easy interval should be > Good interval
    const goodResult = scheduleCard(makeNewCard(), 3, NOW, params);
    expect(reviewLog.scheduledDays).toBeGreaterThan(goodResult.reviewLog.scheduledDays);
  });

  it('difficulty is set and normalized to [0,1]', () => {
    for (const rating of [1, 2, 3, 4] as Rating[]) {
      const { card: next } = scheduleCard(makeNewCard(), rating, NOW, params);
      expect(next.difficulty).toBeGreaterThanOrEqual(0);
      expect(next.difficulty).toBeLessThanOrEqual(1);
    }
  });
});

describe('scheduleCard - learning card', () => {
  function makeLearningCard(): Card {
    const card = makeNewCard();
    const { card: learning } = scheduleCard(card, 1, NOW, params);
    return learning;
  }

  it('Again (1): stays in learning', () => {
    const learning = makeLearningCard();
    const later = new Date(NOW.getTime() + 60_000);
    const { card: next } = scheduleCard(learning, 1, later, params);

    expect(next.state).toBe('learning');
    expect(next.reps).toBe(2);
  });

  it('Good (3): graduates to review', () => {
    const learning = makeLearningCard();
    const later = new Date(NOW.getTime() + 60_000);
    const { card: next, reviewLog } = scheduleCard(learning, 3, later, params);

    expect(next.state).toBe('review');
    expect(reviewLog.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('Easy (4): graduates to review with bonus', () => {
    const learning = makeLearningCard();
    const later = new Date(NOW.getTime() + 60_000);
    const { card: next } = scheduleCard(learning, 4, later, params);

    expect(next.state).toBe('review');
  });
});

describe('scheduleCard - review card', () => {
  function makeReviewCard(): Card {
    const card = makeNewCard();
    const { card: review } = scheduleCard(card, 3, NOW, params);
    return review;
  }

  it('Again (1): moves to relearning, increments lapses', () => {
    const review = makeReviewCard();
    // Simulate 3 days later
    const later = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    const { card: next } = scheduleCard(review, 1, later, params);

    expect(next.state).toBe('relearning');
    expect(next.lapses).toBe(review.lapses + 1);
    expect(next.stability).toBeGreaterThan(0);
  });

  it('Good (3): stays in review with increased stability', () => {
    const review = makeReviewCard();
    const later = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    const { card: next, reviewLog } = scheduleCard(review, 3, later, params);

    expect(next.state).toBe('review');
    expect(next.stability).toBeGreaterThan(review.stability);
    expect(reviewLog.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('Hard (2): applies hard penalty to stability', () => {
    const review = makeReviewCard();
    const later = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    const hard = scheduleCard(review, 2, later, params);
    const good = scheduleCard(review, 3, later, params);

    // Hard should result in lower stability than Good
    expect(hard.card.stability).toBeLessThan(good.card.stability);
  });

  it('Easy (4): applies easy bonus to stability', () => {
    const review = makeReviewCard();
    const later = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    const good = scheduleCard(review, 3, later, params);
    const easy = scheduleCard(review, 4, later, params);

    // Easy should result in higher stability than Good
    expect(easy.card.stability).toBeGreaterThan(good.card.stability);
  });
});

describe('difficulty clamping', () => {
  it('difficulty stays in [0,1] after many Again ratings', () => {
    let card = makeNewCard();
    const time = new Date(NOW);

    // Repeatedly rate Again
    for (let i = 0; i < 20; i++) {
      const { card: next } = scheduleCard(card, 1, time, params);
      card = next;
      time.setMinutes(time.getMinutes() + 1);
      expect(card.difficulty).toBeGreaterThanOrEqual(0);
      expect(card.difficulty).toBeLessThanOrEqual(1);
    }
  });

  it('difficulty stays in [0,1] after many Easy ratings', () => {
    let card = makeNewCard();
    const time = new Date(NOW);

    // Rate Easy, then keep reviewing as Easy
    const { card: first } = scheduleCard(card, 4, time, params);
    card = first;

    for (let i = 0; i < 20; i++) {
      time.setDate(time.getDate() + 30);
      const { card: next } = scheduleCard(card, 4, time, params);
      card = next;
      expect(card.difficulty).toBeGreaterThanOrEqual(0);
      expect(card.difficulty).toBeLessThanOrEqual(1);
    }
  });
});

describe('interval calculation', () => {
  it('interval is at least 1 day for review cards', () => {
    const card = makeNewCard();
    const { card: review, reviewLog } = scheduleCard(card, 3, NOW, params);
    expect(reviewLog.scheduledDays).toBeGreaterThanOrEqual(1);
    expect(review.state).toBe('review');
  });

  it('interval does not exceed maximumInterval', () => {
    const customParams = createDefaultParams();
    customParams.maximumInterval = 30;

    let card = makeNewCard();
    const { card: review } = scheduleCard(card, 4, NOW, customParams);
    card = review;

    // After many easy reviews, interval should not exceed 30
    const time = new Date(NOW);
    for (let i = 0; i < 10; i++) {
      time.setDate(time.getDate() + 30);
      const result = scheduleCard(card, 4, time, customParams);
      expect(result.reviewLog.scheduledDays).toBeLessThanOrEqual(30);
      card = result.card;
    }
  });
});

describe('retrievability', () => {
  it('returns 0 for new cards', () => {
    const card = makeNewCard();
    expect(getRetrievability(card)).toBe(0);
  });

  it('decreases over time for review cards', () => {
    const card = makeNewCard();
    const { card: review } = scheduleCard(card, 3, NOW, params);

    const r1 = getRetrievability(review, new Date(NOW.getTime() + 1 * 24 * 60 * 60 * 1000));
    const r7 = getRetrievability(review, new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000));
    const r30 = getRetrievability(review, new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000));

    expect(r1).toBeGreaterThan(r7);
    expect(r7).toBeGreaterThan(r30);
    expect(r1).toBeLessThanOrEqual(1);
    expect(r30).toBeGreaterThan(0);
  });

  it('is approximately requestRetention at the scheduled interval', () => {
    const card = makeNewCard();
    const { card: review, reviewLog } = scheduleCard(card, 3, NOW, params);
    const dueDate = new Date(NOW.getTime() + reviewLog.scheduledDays * 24 * 60 * 60 * 1000);
    const r = getRetrievability(review, dueDate);

    // Should be close to 0.9 (requestRetention)
    expect(r).toBeCloseTo(0.9, 1);
  });
});

describe('getDueCards', () => {
  it('returns only cards that are due', () => {
    const past = new Date(NOW.getTime() - 1000);
    const card1: Card = { ...createNewCard('c1', 'n1', 'basic', 'Q1', 'A1'), due: past };
    const card2: Card = { ...createNewCard('c2', 'n2', 'basic', 'Q2', 'A2'), due: past };
    const card3 = createNewCard('c3', 'n3', 'basic', 'Q3', 'A3');

    // card1 and card2 are due (due in past)
    // card3 is scheduled for the future
    const future = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduled: Card = { ...card3, due: future };

    const due = getDueCards([card1, card2, scheduled], NOW);
    expect(due).toHaveLength(2);
    expect(due.map((c) => c.id)).toContain('c1');
    expect(due.map((c) => c.id)).toContain('c2');
  });

  it('sorts by due date ascending', () => {
    const c1: Card = {
      ...makeNewCard('a'),
      due: new Date('2025-06-03'),
    };
    const c2: Card = {
      ...makeNewCard('b'),
      due: new Date('2025-06-01'),
    };
    const c3: Card = {
      ...makeNewCard('c'),
      due: new Date('2025-06-02'),
    };

    const due = getDueCards([c1, c2, c3], new Date('2025-06-04'));
    expect(due[0].id).toBe('b');
    expect(due[1].id).toBe('c');
    expect(due[2].id).toBe('a');
  });

  it('returns empty array when no cards are due', () => {
    const card = makeNewCard();
    const future = new Date(NOW.getTime() + 365 * 24 * 60 * 60 * 1000);
    const notDue: Card = { ...card, due: future };
    expect(getDueCards([notDue], NOW)).toHaveLength(0);
  });
});

describe('getStats', () => {
  it('computes correct statistics', () => {
    const cards = [
      { ...makeNewCard('1'), state: 'new' as const },
      { ...makeNewCard('2'), state: 'learning' as const, reps: 1, lapses: 0 },
      { ...makeNewCard('3'), state: 'review' as const, reps: 5, lapses: 1, stability: 30 },
      { ...makeNewCard('4'), state: 'review' as const, reps: 10, lapses: 2, stability: 10 },
      { ...makeNewCard('5'), state: 'relearning' as const, reps: 3, lapses: 3 },
    ];

    const logs = [
      { cardId: '2', rating: 3 as Rating, reviewedAt: NOW, elapsed: 1000, scheduledDays: 1, state: 'learning' as const },
      { cardId: '3', rating: 3 as Rating, reviewedAt: NOW, elapsed: 2000, scheduledDays: 5, state: 'review' as const },
      { cardId: '3', rating: 1 as Rating, reviewedAt: NOW, elapsed: 500, scheduledDays: 0, state: 'relearning' as const },
      { cardId: '4', rating: 4 as Rating, reviewedAt: NOW, elapsed: 800, scheduledDays: 10, state: 'review' as const },
    ];

    const stats = getStats(cards, logs);

    expect(stats.totalCards).toBe(5);
    expect(stats.newCount).toBe(1);
    expect(stats.learningCount).toBe(1);
    expect(stats.reviewCount).toBe(2);
    expect(stats.relearningCount).toBe(1);
    expect(stats.totalReviews).toBe(4);
    expect(stats.retentionRate).toBe(3 / 4); // 3 non-Again out of 4
    expect(stats.maturedCards).toBe(1); // only card 3 has stability > 21
    expect(stats.averageLapses).toBeCloseTo(6 / 4); // 6 total lapses / 4 reviewed cards
  });
});

describe('full review cycle', () => {
  it('simulates a multi-day review cycle', () => {
    let card = makeNewCard();
    let time = new Date(NOW);

    // Day 0: First see, rate Good
    const r1 = scheduleCard(card, 3, time, params);
    card = r1.card;
    expect(card.state).toBe('review');
    expect(card.reps).toBe(1);

    // Jump to due date, rate Good again
    time = new Date(card.due);
    const r2 = scheduleCard(card, 3, time, params);
    card = r2.card;
    expect(card.state).toBe('review');
    expect(card.reps).toBe(2);
    expect(card.stability).toBeGreaterThan(r1.card.stability);

    // Jump to due date, rate Again (lapse)
    time = new Date(card.due);
    const r3 = scheduleCard(card, 1, time, params);
    card = r3.card;
    expect(card.state).toBe('relearning');
    expect(card.lapses).toBe(1);

    // Relearn: rate Good to graduate back
    time = new Date(card.due);
    const r4 = scheduleCard(card, 3, time, params);
    card = r4.card;
    expect(card.state).toBe('review');
    expect(card.lapses).toBe(1); // lapses don't increase on relearn success
  });
});
