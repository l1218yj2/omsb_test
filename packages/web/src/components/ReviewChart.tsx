'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ReviewChartProps {
  data: { date: string; count: number; correct: number }[];
}

export function ReviewChart({ data }: ReviewChartProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Review History</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No review data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
            <Bar dataKey="correct" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="count" fill="#374151" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
