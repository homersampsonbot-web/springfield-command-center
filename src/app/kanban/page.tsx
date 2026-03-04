import KanbanBoard from './KanbanBoard';

export const metadata = {
  title: 'Kanban | Springfield Command Center',
};

export default function KanbanPage() {
  return (
    <main className="min-h-screen bg-[#0D0D1A] text-slate-100 p-8 overflow-hidden flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
                <span className="text-yellow-400">🏗️</span> Springfield Mission Control
            </h1>
            <p className="text-slate-400 text-sm mt-1">Live Operations & Job Orchestration</p>
        </div>
        <div className="flex items-center gap-4">
            <a href="/" className="text-xs font-mono text-slate-500 hover:text-yellow-400 transition-colors">
                ← BACK TO PODIUM
            </a>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </main>
  );
}
