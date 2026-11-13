import { Trophy } from 'lucide-react';

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <header className="flex items-center gap-3 mb-4">
        <Trophy className="w-8 h-8 text-amber-400" />
        <h1 className="text-3xl font-bold tracking-tight">Супер Крестики-Нолики 3D</h1>
      </header>
      <p className="text-slate-400 text-sm">
        Scaffold initialized successfully. Ready for feature implementation.
      </p>
    </div>
  );
}
