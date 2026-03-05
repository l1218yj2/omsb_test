import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OMSB - Oh My Second Brain',
  description: 'AI-powered learning with spaced repetition',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-emerald-400">OMSB</a>
            <div className="flex gap-6">
              <a href="/dashboard" className="text-gray-400 hover:text-white transition">Dashboard</a>
              <a href="/review" className="text-gray-400 hover:text-white transition">Review</a>
              <a href="/quiz" className="text-gray-400 hover:text-white transition">Quiz</a>
              <a href="/notes" className="text-gray-400 hover:text-white transition">Notes</a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
