import { createHash } from 'crypto';
import type {
  GeneratedCard,
  GeneratorConfig,
  NoteContent,
  QuizQuestion,
  QuizType,
} from './types.js';

const SYSTEM_PROMPT = `You are an expert educator creating study materials. Generate flashcards and quiz questions from the provided notes.

Rules:
- Create diverse question types (basic Q&A, cloze deletion, multiple choice, concept explanation)
- Questions should test understanding, not just memorization
- Include varying difficulty levels
- Each card should be self-contained
- For MCQ, provide 4 options with exactly 1 correct answer
- For cloze, use {{c1::answer}} format in the front

Respond with a JSON array of objects, each with:
- type: "basic" | "cloze" | "mcq" | "explain"
- front: the question/prompt
- back: the answer
- tags: relevant topic tags as string array`;

export class QuizGenerator {
  private config: GeneratorConfig;
  private generatedHashes: Set<string> = new Set();

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  async generateCards(
    note: NoteContent,
    types?: QuizType[],
  ): Promise<GeneratedCard[]> {
    const maxCards = this.config.maxCardsPerNote || 10;
    const requestedTypes =
      types ||
      this.config.defaultTypes || ['basic', 'cloze', 'mcq', 'explain'];

    const prompt = `Generate up to ${maxCards} study cards from these notes. Focus on types: ${requestedTypes.join(', ')}.

Title: ${note.title}
Tags: ${note.tags.join(', ')}

Content:
${note.content}

Respond with ONLY a JSON array, no other text.`;

    const response = await this.callLLM(prompt);
    const cards = this.parseResponse(response);

    // Deduplicate
    return cards.filter((card) => {
      const hash = this.hashCard(card);
      if (this.generatedHashes.has(hash)) return false;
      this.generatedHashes.add(hash);
      return true;
    });
  }

  async generateQuiz(
    note: NoteContent,
    count: number = 5,
  ): Promise<QuizQuestion[]> {
    const prompt = `Generate ${count} quiz questions from these notes. Mix difficulty levels.

Title: ${note.title}
Content:
${note.content}

Respond with a JSON array of objects with: type, question, options (for mcq, array of 4 strings), correctAnswer, explanation, difficulty ("easy"|"medium"|"hard").
Respond with ONLY a JSON array, no other text.`;

    const response = await this.callLLM(prompt);
    try {
      const questions = JSON.parse(response);
      return questions.map((q: any, _i: number) => ({
        ...q,
        id: createHash('sha256')
          .update(q.question)
          .digest('hex')
          .slice(0, 12),
        sourceNote: note.filePath,
      }));
    } catch {
      return [];
    }
  }

  private async callLLM(userPrompt: string): Promise<string> {
    if (this.config.provider === 'anthropic') {
      return this.callAnthropic(userPrompt);
    }
    return this.callOpenAI(userPrompt);
  }

  private async callAnthropic(userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    const data = (await response.json()) as any;
    return data.content?.[0]?.text || '[]';
  }

  private async callOpenAI(userPrompt: string): Promise<string> {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
      },
    );
    const data = (await response.json()) as any;
    return data.choices?.[0]?.message?.content || '[]';
  }

  private parseResponse(response: string): GeneratedCard[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]);
    } catch {
      return [];
    }
  }

  private hashCard(card: GeneratedCard): string {
    return createHash('sha256')
      .update(card.front + card.back)
      .digest('hex')
      .slice(0, 16);
  }
}
