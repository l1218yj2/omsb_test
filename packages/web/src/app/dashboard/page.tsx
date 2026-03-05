'use client';
import { useEffect, useState } from 'react';
import { StatsCards } from '@/components/StatsCards';
import { ReviewChart } from '@/components/ReviewChart';
import { DueCards } from '@/components/DueCards';

interface DashboardData {
  totalCards: number;
  dueCount: number;
  reviewsToday: number;
  streak: number;
  successRate: number;
  states: { new: number; learning: number; review: number; relearning: number };
  recentReviews: { date: string; count: number; correct: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <StatsCards
        totalCards={data.totalCards}
        dueCount={data.dueCount}
        streak={data.streak}
        successRate={data.successRate}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReviewChart data={data.recentReviews} />
        <DueCards states={data.states} />
      </div>
    </div>
  );
}
