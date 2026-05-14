'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center gap-4">
      <p className="text-4xl font-bold text-neutral-200">Oops</p>
      <h2 className="text-lg font-semibold text-neutral-900">Something went wrong</h2>
      <p className="text-sm text-neutral-500 max-w-sm">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  );
}
