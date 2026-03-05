export type QuizType = 'basic' | 'cloze' | 'mcq' | 'explain';

export interface GeneratedCard {
  type: QuizType;
  front: string;
  back: string;
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[];      // for MCQ
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceNote: string;
}

export interface GeneratorConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey: string;
  maxCardsPerNote?: number;  // default 10
  defaultTypes?: QuizType[]; // default all types
}

export interface NoteContent {
  filePath: string;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
}
