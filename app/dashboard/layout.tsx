'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
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
  Menu
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold">🎯 Poker Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.team_name || 'Time'}</p>
        </div>

        <nav className="px-4 space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border w-64">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

