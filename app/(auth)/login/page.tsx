import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">InnovatEPAM Portal</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="text-center text-sm text-neutral-500">
          {"Don't have an account? "}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
