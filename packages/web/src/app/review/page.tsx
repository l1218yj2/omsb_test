'use client';
import { useState, useEffect } from 'react';
import { FlashCard } from '@/components/FlashCard';

interface CardData {
  id: string;
  type: string;
  front: string;
  back: string;
  state: string;
  tags: string[];
}

export default function ReviewPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  useEffect(() => {
    fetch('/api/cards/due').then(r => r.json()).then(setCards).catch(console.error);
  }, []);

  const handleRate = async (rating: number) => {
    await fetch('/api/cards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: cards[current].id, rating }),
    });

    setResults(prev => ({
      correct: prev.correct + (rating >= 3 ? 1 : 0),
      total: prev.total + 1,
    }));

    if (current + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrent(prev => prev + 1);
      setFlipped(false);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold">No cards due!</h2>
        <p className="text-gray-400">Come back later or add more notes.</p>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((results.correct / results.total) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <p className="text-gray-400">
          {results.correct}/{results.total} correct ({pct}%)
        </p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-600 rounded-lg">
          Review More
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Review</h1>
        <span className="text-gray-400">{current + 1} / {cards.length}</span>
      </div>
      <FlashCard card={cards[current]} flipped={flipped} onFlip={() => setFlipped(true)} onRate={handleRate} />
    </div>
  );
}
