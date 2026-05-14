'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/components/auth/UserContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function NavBar() {
  const user = useUser();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const navLinks = (
    <>
      {user.role === 'submitter' && (
        <Link href="/dashboard" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
          My Ideas
        </Link>
      )}
      {user.role === 'admin' && (
        <Link href="/admin/dashboard" className="text-sm font-medium text-brand-600 hover:underline">
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold text-brand-700">
          InnovatEPAM
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-5">
          {navLinks}
          <span className="text-sm text-neutral-400">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </nav>

        {/* Mobile: Sheet */}
        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-left text-brand-700">InnovatEPAM</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {navLinks}
                <span className="text-xs text-neutral-400 truncate">{user.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2 w-full">
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

