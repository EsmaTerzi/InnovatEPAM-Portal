import Link from 'next/link';

export function Forbidden() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-neutral-200">403</p>
      <h1 className="mt-4 text-xl font-semibold text-neutral-900">Access Denied</h1>
      <p className="mt-2 text-sm text-neutral-500">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 text-sm font-medium text-brand-600 hover:underline"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
