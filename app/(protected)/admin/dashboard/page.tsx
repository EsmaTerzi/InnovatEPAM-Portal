import { findAllIdeasWithEmail } from '@/lib/db/dao/ideas';
import { AdminIdeaTable } from '@/components/admin/AdminIdeaTable';

export default function AdminDashboardPage() {
  const ideas = findAllIdeasWithEmail();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">All Ideas</h1>
      <AdminIdeaTable ideas={ideas} />
    </div>
  );
}
