import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PokerBot } from '../PokerBot';

export function Layout() {
  const location = useLocation();
  const { user, logout, isTenantAdmin, isSuperAdmin, getTenantInfo } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  
  const tenantInfo = getTenantInfo();

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                <div>
                  <span className="font-bold text-xl">Poker SaaS</span>
                  {tenantInfo && (
                    <div className="text-xs text-slate-400">
                      {tenantInfo.name} • {tenantInfo.plan}
                    </div>
                  )}
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navegação principal */}
              <nav className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/' || location.pathname === '/dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  📊 Dashboard
                </Link>
                
                {isTenantAdmin() && (
                  <Link 
                    to="/new" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/new'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ➕ Nova Sessão
                  </Link>
                )}
                
                <Link 
                  to="/history" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/history'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  📋 Histórico
                </Link>
                <Link 
                  to="/ranking" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/ranking'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🏆 Ranking
                </Link>

                {isTenantAdmin() && (
                  <Link 
                    to="/invites" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/invites'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    👥 Convites
                  </Link>
                )}

                {(user?.role === 'super_admin' || isSuperAdmin()) && (
                  <Link 
                    to="/admin" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/admin'
                        ? 'bg-purple-600 text-white'
                        : 'text-purple-300 hover:bg-purple-700'
                    }`}
                  >
                    👑 Admin Global
                  </Link>
                )}
              </nav>

              {/* Menu do usuário */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="hidden sm:block">{user?.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-gray-500">{user?.email}</div>
                      <div className="text-xs text-gray-400">
                        {user?.role === 'super_admin' ? 'Super Admin' : 
                         user?.role === 'admin' ? 'Administrador' : 'Membro'}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🚪 Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* PokerBot - Disponível em todas as páginas */}
      <PokerBot />
    </div>
  );
}