import type {
  Card,
  CardState,
  Rating,
  ReviewLog,
  SchedulingResult,
  FSRSParameters,
} from './types.js';

// FSRS-5 default parameters w[0..18]
const DEFAULT_W: number[] = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102,
  0.5316, 1.0651, 0.0589, 1.5330, 0.1544,
  1.0100, 1.9279, 0.1443, 0.2856, 2.2272,
  0.0340, 3.0708, 0.5846, 0.5468,
];

/**
 * Returns the default FSRS-5 parameter set.
 */
export function createDefaultParams(): FSRSParameters {
  return {
    w: [...DEFAULT_W],
    requestRetention: 0.9,
    maximumInterval: 36500,
  };
}

/**
 * Creates a brand-new card in the 'new' state, due immediately.
 */
export function createNewCard(
  id: string,
  noteSource: string,
  type: Card['type'],
  front: string,
  back: string,
  tags: string[] = [],
): Card {
  const now = new Date();
  return {
    id,
    noteSource,
    type,
    front,
    back,
    tags,
    created: now,
    difficulty: 0,
    stability: 0,
    state: 'new',
    due: now,
    reps: 0,
    lapses: 0,
  };
}

// ─── Internal helpers ────────────────────────────────────────────

/** Clamp value to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Initial difficulty for a given rating (1-4).
 * D_init(G) = w[4] - exp(w[5] * (G - 1)) + 1
 * Result is on the [1,10] scale.
 */
function initDifficulty(w: number[], rating: Rating): number {
  return w[4] - Math.exp(w[5] * (rating - 1)) + 1;
}

/**
 * Normalize difficulty from [1,10] to [0,1] for storage.
 */
function normalizeDifficulty(d: number): number {
  return (clamp(d, 1, 10) - 1) / 9;
}

/**
 * Denormalize difficulty from [0,1] back to [1,10] for calculations.
 */
function denormalizeDifficulty(d: number): number {
  return clamp(d, 0, 1) * 9 + 1;
}

/**
 * Compute new difficulty after a review.
 * D' = w[7] * D_init(4) + (1 - w[7]) * (D - w[6] * (G - 3))
 * Then clamp to [1,10].
 */
function nextDifficulty(w: number[], d: number, rating: Rating): number {
  const dInit4 = initDifficulty(w, 4);
  const newD = w[7] * dInit4 + (1 - w[7]) * (d - w[6] * (rating - 3));
  return clamp(newD, 1, 10);
}

/**
 * Compute retrievability.
 * R = (1 + elapsed_days / (9 * S))^(-1)
 */
function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Compute interval from stability and target retention.
 * I = S * 9 * (1/R - 1)
 */
function nextInterval(
  stability: number,
  requestRetention: number,
  maximumInterval: number,
): number {
  const interval = stability * 9 * (1 / requestRetention - 1);
  return clamp(Math.round(interval), 1, maximumInterval);
}

/**
 * Initial stability for a given rating on a new card.
 * S_0(G) = w[G-1] for G in {1,2,3,4}
 */
function initStability(w: number[], rating: Rating): number {
  return w[rating - 1];
}

/**
 * Next stability after a successful review (rating 2, 3, or 4).
 * S' = S * (1 + exp(w[8]) * (11 - D) * S^(-w[9]) * (exp(w[10]*(1-R)) - 1) * hardPenalty * easyBonus)
 */
function nextRecallStability(
  w: number[],
  d: number,
  s: number,
  r: number,
  rating: Rating,
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const newS =
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp(w[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus);
  return newS;
}

/**
 * Next stability after a lapse (rating 1 on a review card).
 * S' = w[11] * D^(-w[12]) * ((S+1)^w[13] - 1) * exp(w[14]*(1-R))
 */
function nextForgetStability(
  w: number[],
  d: number,
  s: number,
  r: number,
): number {
  return (
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r))
  );
}

// ─── Main scheduling function ────────────────────────────────────

/**
 * Schedule a card after a review with the given rating.
 * Returns the updated card and a review log entry.
 */
export function scheduleCard(
  card: Card,
  rating: Rating,
  now: Date = new Date(),
  params: FSRSParameters = createDefaultParams(),
): SchedulingResult {
  const { w, requestRetention, maximumInterval } = params;

  // Clone card to avoid mutation
  const next: Card = { ...card };
  next.reps += 1;
  next.lastReview = now;

  let scheduledDays = 0;

  if (card.state === 'new') {
    // ── New card ──
    const s0 = initStability(w, rating);
    const d0 = initDifficulty(w, rating);

    next.stability = s0;
    next.difficulty = normalizeDifficulty(d0);

    if (rating === 1) {
      next.state = 'learning';
      scheduledDays = 0; // review again same session (~1 min)
      next.due = new Date(now.getTime() + 60 * 1000);
    } else if (rating === 2) {
      next.state = 'learning';
      scheduledDays = 0; // ~5 min
      next.due = new Date(now.getTime() + 5 * 60 * 1000);
    } else if (rating === 3) {
      next.state = 'review';
      scheduledDays = nextInterval(s0, requestRetention, maximumInterval);
      next.due = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
    } else {
      // rating === 4 (Easy)
      const easyInterval = nextInterval(s0, requestRetention, maximumInterval);
      // Apply easy bonus via w[16] to interval
      scheduledDays = Math.min(
        Math.round(easyInterval * w[16]),
        maximumInterval,
      );
      next.state = 'review';
      next.due = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
    }
  } else if (card.state === 'learning' || card.state === 'relearning') {
    // ── Learning / Relearning ──
    const d = denormalizeDifficulty(card.difficulty);
    const newD = nextDifficulty(w, d, rating);
    next.difficulty = normalizeDifficulty(newD);

    if (rating === 1) {
      // Stay in same state, reset
      next.state = card.state;
      next.stability = initStability(w, 1);
      scheduledDays = 0;
      next.due = new Date(now.getTime() + 60 * 1000);
    } else if (rating === 2) {
      // Stay, slightly longer
      next.state = card.state;
      next.stability = initStability(w, 2);
      scheduledDays = 0;
      next.due = new Date(now.getTime() + 10 * 60 * 1000);
    } else {
      // rating 3 or 4: graduate to review
      const s =
        card.stability > 0
          ? card.stability
          : initStability(w, rating);
      next.stability = s;
      next.state = 'review';
      let days = nextInterval(s, requestRetention, maximumInterval);
      if (rating === 4) {
        days = Math.min(Math.round(days * w[16]), maximumInterval);
      }
      scheduledDays = days;
      next.due = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);
    }
  } else {
    // ── Review ──
    const d = denormalizeDifficulty(card.difficulty);
    const s = card.stability;
    const elapsedDays = card.lastReview
      ? (now.getTime() - card.lastReview.getTime()) / (24 * 60 * 60 * 1000)
      : 0;
    // Use the card's previous lastReview to compute elapsed, but we already set next.lastReview = now
    // so use original card.lastReview
    const r = retrievability(elapsedDays, s);

    const newD = nextDifficulty(w, d, rating);
    next.difficulty = normalizeDifficulty(newD);

    if (rating === 1) {
      // Lapse
      next.state = 'relearning';
      next.lapses += 1;
      const newS = nextForgetStability(w, d, s, r);
      next.stability = Math.max(newS, 0.01); // floor to avoid zero
      scheduledDays = 0;
      next.due = new Date(now.getTime() + 60 * 1000);
    } else {
      // Successful recall
      next.state = 'review';
      const newS = nextRecallStability(w, d, s, r, rating);
      next.stability = Math.max(newS, 0.01);
      scheduledDays = nextInterval(
        next.stability,
        requestRetention,
        maximumInterval,
      );
      next.due = new Date(
        now.getTime() + scheduledDays * 24 * 60 * 60 * 1000,
      );
    }
  }

  const reviewLog: ReviewLog = {
    cardId: card.id,
    rating,
    reviewedAt: now,
    elapsed: 0, // caller should set actual elapsed time
    scheduledDays,
    state: next.state,
  };

  return { card: next, reviewLog };
}

/**
 * Returns cards that are due for review (due <= now).
 * Sorted by due date ascending (most overdue first).
 */
export function getDueCards(cards: Card[], now: Date = new Date()): Card[] {
  return cards
    .filter((c) => c.due.getTime() <= now.getTime())
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

/**
 * Compute retrievability for a card at the given time.
 */
export function getRetrievability(card: Card, now: Date = new Date()): number {
  if (card.state === 'new' || card.stability <= 0) return 0;
  if (!card.lastReview) return 0;
  const elapsedDays =
    (now.getTime() - card.lastReview.getTime()) / (24 * 60 * 60 * 1000);
  return retrievability(elapsedDays, card.stability);
}

/**
 * Returns learning statistics for the given cards and review logs.
 */
export function getStats(
  cards: Card[],
  reviewLogs: ReviewLog[],
): {
  totalCards: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  totalReviews: number;
  averageLapses: number;
  retentionRate: number;
  maturedCards: number;
} {
  const totalCards = cards.length;
  const newCount = cards.filter((c) => c.state === 'new').length;
  const learningCount = cards.filter((c) => c.state === 'learning').length;
  const reviewCount = cards.filter((c) => c.state === 'review').length;
  const relearningCount = cards.filter((c) => c.state === 'relearning').length;
  const totalReviews = reviewLogs.length;

  const totalLapses = cards.reduce((sum, c) => sum + c.lapses, 0);
  const reviewedCards = cards.filter((c) => c.reps > 0).length;
  const averageLapses = reviewedCards > 0 ? totalLapses / reviewedCards : 0;

  // Retention rate: proportion of non-Again ratings
  const successfulReviews = reviewLogs.filter((l) => l.rating > 1).length;
  const retentionRate =
    totalReviews > 0 ? successfulReviews / totalReviews : 0;

  // Matured cards: review state with stability > 21 days
  const maturedCards = cards.filter(
    (c) => c.state === 'review' && c.stability > 21,
  ).length;

  return {
    totalCards,
    newCount,
    learningCount,
    reviewCount,
    relearningCount,
    totalReviews,
    averageLapses,
    retentionRate,
    maturedCards,
  };
}
