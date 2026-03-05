'use client';

interface FlashCardProps {
  card: { front: string; back: string; type: string; tags: string[] };
  flipped: boolean;
  onFlip: () => void;
  onRate: (rating: number) => void;
}

export function FlashCard({ card, flipped, onFlip, onRate }: FlashCardProps) {
  return (
    <div className="space-y-6">
      <div
        onClick={!flipped ? onFlip : undefined}
        className={`bg-gray-900 border border-gray-800 rounded-2xl p-8 min-h-[300px] flex flex-col justify-center items-center cursor-pointer transition-all ${!flipped ? 'hover:border-emerald-600' : ''}`}
      >
        <span className="text-xs text-gray-500 uppercase mb-4">{card.type}</span>
        <p className="text-xl text-center leading-relaxed">{flipped ? card.back : card.front}</p>
        {!flipped && <p className="text-gray-600 mt-6 text-sm">Click to reveal answer</p>}
      </div>
      {flipped && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { rating: 1, label: 'Again', color: 'bg-red-600 hover:bg-red-500' },
            { rating: 2, label: 'Hard', color: 'bg-orange-600 hover:bg-orange-500' },
            { rating: 3, label: 'Good', color: 'bg-emerald-600 hover:bg-emerald-500' },
            { rating: 4, label: 'Easy', color: 'bg-blue-600 hover:bg-blue-500' },
          ].map(({ rating, label, color }) => (
            <button key={rating} onClick={() => onRate(rating)} className={`${color} py-3 rounded-lg font-medium transition`}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {card.tags.map(tag => (
          <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
    </div>
  );
}
