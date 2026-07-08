'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isReady = useAuthGuard();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
