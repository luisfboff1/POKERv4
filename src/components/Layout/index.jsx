import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo e Nome */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl mr-2">🎲</span>
                <span className="font-bold text-xl">Poker Settlements</span>
              </Link>
            </div>

            {/* Links de Navegação */}
            <nav className="flex items-center space-x-4">
              <Link 
                to="/new" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/poker/new' || location.pathname === '/new'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Nova Sessão
              </Link>
              <Link 
                to="/history" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/poker/history' || location.pathname === '/history'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Histórico
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>Poker Settlements &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}