'use client';
import { useEffect, useState } from 'react';

export default function NotesPage() {
  const [notes, setNotes] = useState<{ name: string; cardCount: number }[]>([]);
  useEffect(() => { fetch('/api/notes').then(r => r.json()).then(setNotes).catch(console.error); }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notes</h1>
      {notes.length === 0 ? (
        <p className="text-gray-500">No notes yet. Use <code className="bg-gray-800 px-2 py-1 rounded">omsb add</code> to import.</p>
      ) : (
        <div className="grid gap-4">
          {notes.map(note => (
            <div key={note.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
              <span>{note.name}</span>
              <span className="text-gray-400 text-sm">{note.cardCount} cards</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
