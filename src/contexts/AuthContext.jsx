import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Se não tem token, não está logado
      if (!api.getToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Verificar se o token ainda é válido
      const response = await api.verifyToken();
      setUser(response.data.user);
    } catch (error) {
      console.warn('Token inválido:', error);
      setUser(null);
      api.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.login(email, password);
      setUser(response.data.user);
      
      return response.data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.logout();
    } catch (error) {
      console.warn('Erro no logout:', error);
    } finally {
      setUser(null);
      setLoading(false);
      // Redirecionar para login
      window.location.href = '/login';
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.register(userData);
      return response.data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const response = await api.getProfile();
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.warn('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  // Verificar roles
  const isAuthenticated = () => {
    return !!user && !!api.getToken();
  };

  const isSuperAdmin = () => {
    // Verificar tanto o estado quanto o localStorage
    const currentUser = user || api.getUser();
    return currentUser && currentUser.role === 'super_admin';
  };

  const isTenantAdmin = () => {
    const currentUser = user || api.getUser();
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');
  };

  const isRegularUser = () => {
    return user && user.role === 'user';
  };

  // Informações do tenant
  const getTenantInfo = () => {
    return user ? {
      id: user.tenant_id,
      name: user.tenant_name,
      plan: user.tenant_plan
    } : null;
  };

  const value = {
    // Estado
    user,
    loading,
    error,
    
    // Ações
    login,
    logout,
    register,
    updateProfile,
    checkAuth,
    
    // Verificações
    isAuthenticated,
    isSuperAdmin,
    isTenantAdmin,
    isRegularUser,
    getTenantInfo,
    
    // Utilitários
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
