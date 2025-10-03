import React from 'react';
import Link from 'next/link';
import { Button } from './button';

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

export function Sidebar({ user, navigation, sidebarOpen, setSidebarOpen, logout }: SidebarProps) {
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
        <div className="space-y-1 overflow-hidden">
          <h1 className={`text-lg font-semibold transition-all duration-300 whitespace-nowrap ${collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-none'}`}>🎯 Poker Manager</h1>
          {!collapsed && <p className="text-xs text-muted-foreground transition-opacity duration-300">{user.team_name || 'Time'}</p>}
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
              className={`flex items-center rounded-lg px-3 py-2 font-medium text-foreground/90 transition-all hover:bg-accent hover:text-accent-foreground ${collapsed ? 'justify-center' : 'gap-3'}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="transition-opacity duration-300">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      {/* User Info + Logout */}
      <div className="border-t border-border px-4 py-4">
        {!collapsed && (
          <div className="mb-3 space-y-1 rounded-md border border-border/60 bg-[#2c4d3b] dark:bg-[#1a2a1f] px-3 py-3 transition-opacity duration-300">
            <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrador' : 'Jogador'}
            </p>
          </div>
        )}
        <Button
          variant="outline"
          className={`transition-all duration-300 ${collapsed ? 'w-10 h-10 p-0' : 'w-full'}`}
          onClick={logout}
          title={collapsed ? "Sair" : undefined}
        >
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          ) : (
            "Sair"
          )}
        </Button>
      </div>
    </aside>
  );
}
