export type CardState = 'new' | 'learning' | 'review' | 'relearning';
export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface Card {
  id: string;
  noteSource: string;
  type: 'basic' | 'cloze' | 'mcq' | 'explain';
  front: string;
  back: string;
  tags: string[];
  created: Date;
  difficulty: number;    // [0,1]
  stability: number;     // days
  state: CardState;
  due: Date;
  lastReview?: Date;
  reps: number;
  lapses: number;
}

export interface ReviewLog {
  cardId: string;
  rating: Rating;
  reviewedAt: Date;
  elapsed: number;       // ms spent
  scheduledDays: number;
  state: CardState;
}

export interface SchedulingResult {
  card: Card;
  reviewLog: ReviewLog;
}

export interface FSRSParameters {
  w: number[];           // 19 parameters w[0..18]
  requestRetention: number; // target retention rate (default 0.9)
  maximumInterval: number;  // max days between reviews (default 36500)
}
