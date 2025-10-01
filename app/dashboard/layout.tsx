'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Plus,
  History,
  Trophy,
  Users,
  Shield,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'player'] },
    { name: 'Nova Sessão', href: '/dashboard/new', icon: Plus, roles: ['super_admin', 'admin'] },
    { name: 'Histórico', href: '/dashboard/history', icon: History, roles: ['super_admin', 'admin', 'player'] },
    { name: 'Ranking', href: '/dashboard/ranking', icon: Trophy, roles: ['super_admin', 'admin', 'player'] },
    { name: 'Convites', href: '/dashboard/invites', icon: Users, roles: ['super_admin', 'admin'] },
    { name: 'Admin', href: '/dashboard/admin', icon: Shield, roles: ['super_admin'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen bg-page text-page-foreground">
      {/* Mobile Menu Button */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur md:hidden">
        <h1 className="text-base font-semibold">🎯 Poker Manager</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Responsiva */}
      <aside className={`
        fixed md:static
        inset-y-0 left-0
        z-40
        w-64
        bg-surface text-surface-foreground
        border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        flex flex-col
      `}>
        {/* Header da Sidebar (desktop) */}
        <div className="hidden items-center justify-between border-b border-border px-4 py-4 md:flex">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">🎯 Poker Manager</h1>
            <p className="text-xs text-muted-foreground">
              {user.team_name || 'Time'}
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6 text-sm">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-foreground/90 transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 space-y-1 rounded-md border border-border/60 bg-page px-3 py-3">
            <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrador' : 'Jogador'}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-page text-page-foreground">
        <div className="mt-16 space-y-6 p-4 md:mt-0 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
