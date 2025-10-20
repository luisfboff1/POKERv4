'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  LayoutDashboard,
  Plus,
  History,
  Trophy,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  Target
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || !user) {
    // Use refactored LoadingSpinner for modern visual
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <span className="text-lg font-semibold text-muted-foreground animate-pulse">Carregando...</span>
          <div className="">
            {/* Refactored loading spinner */}
            <div className="animate-spin rounded-full border-2 border-border border-t-primary bg-white/30 backdrop-blur-md shadow-lg h-12 w-12 transition-all duration-300" aria-label="Carregando" role="status" />
          </div>
        </div>
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
  <div className={`flex min-h-screen bg-page text-page-foreground ${sidebarOpen ? 'overflow-hidden touch-none' : ''}`}>
      {/* Mobile Menu Button */}
  <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 shadow-[var(--shadow-soft)] backdrop-blur md:hidden">
        <h1 className="text-base font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Poker Manager
        </h1>
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
        z-[70]
        w-64
        bg-white/70 backdrop-blur-xl shadow-xl text-surface-foreground
        border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        flex flex-col
        transition-all duration-300
      `}>
        {/* Header da Sidebar (desktop) */}
        <div className="hidden items-center justify-between border-b border-border px-4 py-4 md:flex">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Poker Manager
            </h1>
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
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground/90 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 space-y-1 rounded-xl border border-border/40 bg-white/60 backdrop-blur px-3 py-3 shadow-sm">
            <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrador' : 'Jogador'}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full bg-white/80 backdrop-blur shadow transition-all duration-200"
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
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 bg-page text-page-foreground overflow-hidden">
        {/* Wrapper que garante que em mobile o topo do conteúdo não fique atrás do header fixo */}
        <div className="h-full w-full overflow-y-auto pt-14 md:pt-0 space-y-6 p-4 md:p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
