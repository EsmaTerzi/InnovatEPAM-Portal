import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { IdeaSubmitForm } from '@/components/ideas/IdeaSubmitForm';

export default async function NewIdeaPage() {
  const user = await getSessionUser();
  if (user?.role === 'admin') redirect('/admin/dashboard');
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Submit a New Idea</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Share your innovation idea with the team.
        </p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <IdeaSubmitForm />
      </div>
    </div>
  );
}
