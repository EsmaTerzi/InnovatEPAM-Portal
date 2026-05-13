'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/components/auth/UserContext';

export function NavBar() {
  const user = useUser();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-brand-700">
          InnovatEPAM
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-neutral-500 sm:block">{user.email}</span>
          {user.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
