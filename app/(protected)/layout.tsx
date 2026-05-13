import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { UserProvider } from '@/components/auth/UserContext';
import { NavBar } from '@/components/auth/NavBar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <UserProvider user={{ id: user.id, email: user.email, role: user.role }}>
      <div className="min-h-screen bg-neutral-50">
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </UserProvider>
  );
}
