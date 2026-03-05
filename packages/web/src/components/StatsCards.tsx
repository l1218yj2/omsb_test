interface StatsCardsProps {
  totalCards: number;
  dueCount: number;
  streak: number;
  successRate: number;
}

export function StatsCards({ totalCards, dueCount, streak, successRate }: StatsCardsProps) {
  const stats = [
    { label: 'Total Cards', value: totalCards, icon: '📚' },
    { label: 'Due Today', value: dueCount, icon: '📋' },
    { label: 'Streak', value: `${streak}d`, icon: '🔥' },
    { label: 'Success Rate', value: `${successRate}%`, icon: '🎯' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon }) => (
        <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl mb-2">{icon}</div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-400">{label}</div>
        </div>
      ))}
    </div>
  );
}
