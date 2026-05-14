import { getSessionUser } from '@/lib/auth/session';
import { Forbidden } from '@/components/errors/Forbidden';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== 'admin') {
    return <Forbidden />;
  }

  return <>{children}</>;
}
