import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import { findIdeasByUser } from '@/lib/db/dao/ideas';
import { IdeaList } from '@/components/ideas/IdeaList';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null; // layout already redirects

  const ideas = findIdeasByUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">My Ideas</h1>
        <Button asChild>
          <Link href="/ideas/new">Submit New Idea</Link>
        </Button>
      </div>
      <IdeaList ideas={ideas} />
    </div>
  );
}
