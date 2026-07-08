'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Bell,
  User,
  UserCheck,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { performLogout } from '@/lib/auth-session';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/discover', label: 'Discover', icon: Search, founderLabel: 'Discover investors' },
  { href: '/requests', label: 'Requests', icon: UserCheck },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const handleLogout = () => performLogout(router.push);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Shield className="h-7 w-7 text-violet-600" />
          <span className="text-xl font-bold">INverge</span>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {baseNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const label =
              item.href === '/discover' && user?.role === 'FOUNDER'
                ? item.founderLabel ?? item.label
                : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {item.href === '/notifications' && unreadCount > 0 && (
                  <Badge className="ml-auto">{unreadCount}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-zinc-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Shield className="h-6 w-6 text-violet-600" />
            INverge
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
