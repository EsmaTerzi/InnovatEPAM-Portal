import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 text-center px-4">
      <p className="text-6xl font-bold text-neutral-200">404</p>
      <h1 className="mt-4 text-xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 text-sm font-medium text-brand-600 hover:underline"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
