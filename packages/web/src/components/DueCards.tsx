interface DueCardsProps {
  states: { new: number; learning: number; review: number; relearning: number };
}

export function DueCards({ states }: DueCardsProps) {
  const items = [
    { label: 'New', count: states.new, color: 'bg-blue-500' },
    { label: 'Learning', count: states.learning, color: 'bg-yellow-500' },
    { label: 'Review', count: states.review, color: 'bg-emerald-500' },
    { label: 'Relearning', count: states.relearning, color: 'bg-red-500' },
  ];
  const total = Object.values(states).reduce((a, b) => a + b, 0);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Card States</h3>
      <div className="space-y-3">
        {items.map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-20 text-sm text-gray-400">{label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className={`${color} h-full rounded-full`} style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
            </div>
            <span className="text-sm w-8 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
