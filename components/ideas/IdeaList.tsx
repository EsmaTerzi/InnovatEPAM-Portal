import { IdeaCard } from './IdeaCard';
import type { Idea } from '@/lib/db/dao/ideas';

export function IdeaList({ ideas }: { ideas: Idea[] }) {
  if (ideas.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No ideas submitted yet. Submit your first idea.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}
