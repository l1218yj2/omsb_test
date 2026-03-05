import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 className="text-5xl font-bold text-emerald-400">Oh My Second Brain</h1>
      <p className="text-xl text-gray-400 max-w-lg text-center">
        AI-powered learning with spaced repetition. Remember everything you study.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition">
          Dashboard
        </Link>
        <Link href="/review" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition">
          Start Review
        </Link>
      </div>
    </div>
  );
}
