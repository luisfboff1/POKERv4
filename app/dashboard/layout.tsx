'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { TenantSwitcher } from '@/components/TenantSwitcher';
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
  Spade,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    { name: 'Agendar Jogo', href: '/dashboard/schedule', icon: Calendar, roles: ['super_admin', 'admin'] },
    { name: 'Histórico', href: '/dashboard/history', icon: History, roles: ['super_admin', 'admin', 'player'] },
    { name: 'Ranking', href: '/dashboard/ranking', icon: Trophy, roles: ['super_admin', 'admin', 'player'] },
    { name: 'Convites', href: '/dashboard/invites', icon: Users, roles: ['super_admin', 'admin'] },
    { name: 'Admin', href: '/dashboard/admin', icon: Shield, roles: ['super_admin', 'admin'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur-xl md:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
            <Spade className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Poker Manager</h1>
            <p className="text-xs text-muted-foreground">{user.team_name || 'Time'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="relative"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static left-0 z-40 flex flex-col',
          'top-16 bottom-0 md:top-0 md:bottom-auto md:inset-y-0',
          'bg-card/80 backdrop-blur-lg border-r border-border/60 shadow-xl',
          'transform transition-all duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          sidebarCollapsed ? 'md:w-16' : 'md:w-72'
        )}
      >
        {/* Logo Section - Desktop Only */}
        <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-border/30">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg ring-2 ring-primary/20 transition-all duration-200",
            sidebarCollapsed && "mx-auto"
          )}>
            <Spade className="h-6 w-6 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate">Poker Manager</h1>
              <p className="text-xs text-muted-foreground truncate">{user.team_name || 'Time'}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 hover:bg-accent/50 transition-all duration-200"
          >
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform duration-200",
              sidebarCollapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-3 rounded-xl',
                  'font-medium text-sm transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  sidebarCollapsed && 'md:justify-center md:px-3'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-transform duration-200 flex-shrink-0',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )} />
                {!sidebarCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                {isActive && !sidebarCollapsed && (
                  <ChevronRight className="w-4 h-4 opacity-70 flex-shrink-0" />
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 bg-primary-foreground rounded-r-full",
                    sidebarCollapsed ? "w-1 h-6" : "w-1 h-8"
                  )} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/30 space-y-3">
          {!sidebarCollapsed && (
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-4 backdrop-blur-sm border border-border/30 hover:border-border/50 transition-all duration-200">
              <div className="relative z-10 space-y-1.5">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Player'}
                </div>
              </div>
            </div>
          )}

          {/* Tenant Switcher */}
          {!sidebarCollapsed && <TenantSwitcher 
            currentTenantId={user.team_id}
            currentTenantName={user.team_name}
          />}

          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              'w-full justify-start gap-3 h-11 rounded-xl',
              'hover:bg-destructive/10 hover:text-destructive',
              'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
              sidebarCollapsed && 'md:justify-center md:px-3'
            )}
            title={sidebarCollapsed ? 'Sair da conta' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sair da conta</span>}
          </Button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 mt-16 md:mt-0 overflow-x-hidden">
        <div className={cn(
          "h-full w-full overflow-y-auto overflow-x-hidden p-4 md:p-8 transition-all duration-300",
          sidebarCollapsed && "md:ml-0"
        )}>
          <div className="w-full max-w-full">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
