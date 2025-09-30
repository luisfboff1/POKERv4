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
    <div className="min-h-screen flex">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">🎯 Poker Manager</h1>
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
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        flex flex-col
      `}>
        {/* Header da Sidebar (desktop) */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎯 Poker Manager</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.team_name || 'Time'}</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
