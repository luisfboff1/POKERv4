import React from 'react';
// ...existing code...
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Removed unused imports
// import { ThemeToggle } from '@/components/theme-toggle';
// import { LayoutDashboard, Plus, History, Trophy, Users, Shield, LogOut } from 'lucide-react';

export interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    team_name?: string;
  };
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    roles: string[];
  }>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, navigation, sidebarOpen, setSidebarOpen, logout }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const filteredNavigation = navigation.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={
        [
          'fixed md:static',
          'inset-y-0 left-0 z-[70]',
          collapsed ? 'w-16' : 'w-64',
          'bg-sidebar text-sidebar-foreground',
          'border-r border-border',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          'flex flex-col',
        ].join(' ')
      }
    >
      {/* Header da Sidebar (desktop) */}
      <div className="hidden items-center justify-between border-b border-border px-4 py-4 md:flex">
        <div className="space-y-1">
          <h1 className={`text-lg font-semibold transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>🎯 Poker Manager</h1>
          {!collapsed && <p className="text-xs text-muted-foreground">{user.team_name || 'Time'}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          <span className="sr-only">{collapsed ? 'Expandir' : 'Recolher'}</span>
          <svg className={`h-5 w-5 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" /></svg>
        </Button>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-foreground/90 transition-all hover:bg-accent hover:text-accent-foreground ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      {/* User Info + Logout */}
      <div className="border-t border-border px-4 py-4">
        <div className="mb-3 space-y-1 rounded-md border border-border/60 bg-[#2c4d3b] dark:bg-[#1a2a1f] px-3 py-3">
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
          {/* Removido ícone LogOut não definido */}
          Sair
        </Button>
      </div>
    </aside>
  );
};
