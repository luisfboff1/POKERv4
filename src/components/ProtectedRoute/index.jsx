import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, requireRole = null, requireSuperAdmin = false }) => {
  const { user, loading, isAuthenticated, isSuperAdmin, isTenantAdmin } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se requer autenticação mas não está logado
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não requer autenticação mas está logado (ex: página de login)
  if (!requireAuth && isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar role específica
  if (requireRole) {
    const hasRequiredRole = () => {
      switch (requireRole) {
        case 'super_admin':
          return isSuperAdmin();
        case 'admin':
          return isTenantAdmin();
        case 'user':
          return user && user.role === 'user';
        default:
          return false;
      }
    };

    if (!hasRequiredRole()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
            <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  // Verificar super admin
  if (requireSuperAdmin && !isSuperAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Requerido</h1>
          <p className="text-gray-600 mb-4">Esta área é restrita apenas para super administradores.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
