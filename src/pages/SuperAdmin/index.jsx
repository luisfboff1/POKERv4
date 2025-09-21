import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const SuperAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [globalStats, setGlobalStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros para tenants
  const [tenantFilters, setTenantFilters] = useState({
    status: 'all',
    plan: 'all',
    limit: 20,
    offset: 0
  });

  // Estado para gerenciamento de usuários
  const [allUsers, setAllUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    tenant: 'all',
    role: 'all'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'tenants') {
      loadTenants();
    } else if (activeTab === 'users') {
      loadAllUsers();
    } else if (activeTab === 'activity') {
      loadRecentActivity();
    } else if (activeTab === 'revenue') {
      loadRevenueData();
    }
  }, [activeTab, tenantFilters, userFilters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Tentar carregar dados reais
      try {
        const statsResponse = await api.getGlobalStats();
        setGlobalStats(statsResponse.data);
      } catch (apiError) {
        console.warn('APIs ainda não funcionam, usando dados mock:', apiError.message);
        
        // Dados mock temporários para demonstração
        setGlobalStats({
          overview: {
            active_tenants: 1,
            total_active_users: 1,
            sessions_this_month: 0,
            estimated_monthly_revenue: 99
          },
          growth: {
            new_tenants_this_month: 1,
            new_users_this_month: 1,
            sessions_last_7_days: 0
          }
        });
      }
    } catch (error) {
      setError('Erro ao carregar estatísticas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await api.getAllTenants(tenantFilters);
      setTenants(response.data.tenants || []);
    } catch (error) {
      setError('Erro ao carregar tenants: ' + error.message);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await api.getRecentActivity();
      setRecentActivity(response.data || []);
    } catch (error) {
      setError('Erro ao carregar atividades: ' + error.message);
    }
  };

  const loadRevenueData = async () => {
    try {
      const response = await api.getRevenueReport();
      setRevenueData(response.data);
    } catch (error) {
      setError('Erro ao carregar dados de receita: ' + error.message);
    }
  };

  const loadAllUsers = async () => {
    console.log('👥 [DEBUG] Carregando usuários com filtros:', userFilters);
    
    try {
      console.log('👥 [DEBUG] Chamando API getAllUsers...');
      const response = await api.getAllUsers(userFilters);
      console.log('👥 [DEBUG] Resposta completa da API:', response);
      console.log('👥 [DEBUG] Dados dos usuários:', response.data);
      
      setAllUsers(response.data?.users || response.data || []);
    } catch (error) {
      console.error('❌ [DEBUG] Erro completo ao carregar usuários:', error);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Error message:', error.message);
      setError('Erro ao carregar usuários: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    console.log('🗑️ [DEBUG] Tentando remover usuário (SuperAdmin):', { userId, userName });
    
    if (window.confirm(`Tem certeza que deseja remover o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      try {
        console.log('🗑️ [DEBUG] Chamando API deleteUser...');
        const response = await api.deleteUser(userId);
        console.log('🗑️ [DEBUG] Resposta da API:', response);
        
        alert('Usuário removido com sucesso!');
        loadAllUsers(); // Recarregar lista
      } catch (error) {
        console.error('❌ [DEBUG] Erro completo ao remover usuário:', error);
        console.error('❌ [DEBUG] Error stack:', error.stack);
        console.error('❌ [DEBUG] Error message:', error.message);
        alert('Erro ao remover usuário: ' + error.message);
      }
    }
  };

  const handleResetUserPassword = async (userId, userName) => {
    console.log('🔑 [DEBUG] Tentando alterar senha (SuperAdmin):', { userId, userName });
    
    const newPassword = prompt(`Digite a nova senha para "${userName}" (mínimo 6 caracteres):`);
    
    if (newPassword && newPassword.length >= 6) {
      try {
        console.log('🔑 [DEBUG] Chamando API resetUserPassword...');
        const response = await api.resetUserPassword(userId, newPassword);
        console.log('🔑 [DEBUG] Resposta da API:', response);
        
        alert(`Senha de "${userName}" alterada com sucesso!`);
      } catch (error) {
        console.error('❌ [DEBUG] Erro completo ao alterar senha:', error);
        console.error('❌ [DEBUG] Error stack:', error.stack);
        console.error('❌ [DEBUG] Error message:', error.message);
        alert('Erro ao alterar senha: ' + error.message);
      }
    } else if (newPassword) {
      alert('Senha deve ter pelo menos 6 caracteres');
    }
  };

  const handleTenantAction = async (action, tenantId, data = {}) => {
    try {
      switch (action) {
        case 'suspend':
          await api.suspendTenant(tenantId, data.reason);
          break;
        case 'activate':
          await api.activateTenant(tenantId);
          break;
        case 'change_plan':
          await api.changeTenantPlan(tenantId, data.plan);
          break;
      }
      
      // Recarregar dados
      await loadTenants();
      alert('Ação executada com sucesso!');
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'basic': return 'text-blue-600 bg-blue-100';
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando dashboard global...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          👑 Dashboard Super Admin
        </h1>
        <p className="text-slate-400">
          Olá, {user?.name}! Visão global de todos os tenants do sistema.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}


      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '📊 Visão Geral', icon: '📊' },
              { id: 'tenants', label: '🏢 Tenants', icon: '🏢' },
              { id: 'users', label: '👥 Usuários', icon: '👥' },
              { id: 'activity', label: '📈 Atividade', icon: '📈' },
              { id: 'revenue', label: '💰 Receita', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && globalStats && (
        <div className="space-y-8">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🏢</div>
                <div>
                  <div className="text-2xl font-bold text-white">{globalStats.overview?.active_tenants || 0}</div>
                  <div className="text-slate-400 text-sm">Tenants Ativos</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <div className="text-2xl font-bold text-white">{globalStats.overview?.total_active_users || 0}</div>
                  <div className="text-slate-400 text-sm">Usuários Ativos</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🎲</div>
                <div>
                  <div className="text-2xl font-bold text-white">{globalStats.overview?.sessions_this_month || 0}</div>
                  <div className="text-slate-400 text-sm">Sessões Este Mês</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">💰</div>
                <div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(globalStats.overview?.estimated_monthly_revenue || 0)}</div>
                  <div className="text-slate-400 text-sm">MRR Estimado</div>
                </div>
              </div>
            </div>
          </div>

          {/* Crescimento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Crescimento Mensal</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Novos Tenants:</span>
                  <span className="text-white font-medium">{globalStats.growth?.new_tenants_this_month || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Novos Usuários:</span>
                  <span className="text-white font-medium">{globalStats.growth?.new_users_this_month || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sessões (7 dias):</span>
                  <span className="text-white font-medium">{globalStats.growth?.sessions_last_7_days || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Distribuição de Planos</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Basic:</span>
                  <span className="text-blue-400 font-medium">{globalStats.overview?.basic_plans || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Premium:</span>
                  <span className="text-purple-400 font-medium">{globalStats.overview?.premium_plans || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Enterprise:</span>
                  <span className="text-orange-400 font-medium">{globalStats.overview?.enterprise_plans || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">⚡ Status do Sistema</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pendentes:</span>
                  <span className="text-yellow-400 font-medium">{globalStats.overview?.pending_tenants || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Suspensos:</span>
                  <span className="text-red-400 font-medium">{globalStats.overview?.suspended_tenants || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Último Login:</span>
                  <span className="text-white font-medium text-xs">{formatDate(globalStats.growth?.last_user_login)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <select
                value={tenantFilters.status}
                onChange={(e) => setTenantFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="suspended">Suspensos</option>
              </select>

              <select
                value={tenantFilters.plan}
                onChange={(e) => setTenantFilters(prev => ({ ...prev, plan: e.target.value }))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value="all">Todos os Planos</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Lista de Tenants */}
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Sessões
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Criado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{tenant.name}</div>
                          <div className="text-sm text-slate-400">{tenant.email}</div>
                          <div className="text-xs text-slate-500">{tenant.admin_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(tenant.plan)}`}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {tenant.active_users}/{tenant.max_users}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {tenant.sessions_this_month}/{tenant.max_sessions_per_month}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(tenant.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          {tenant.status === 'active' ? (
                            <button
                              onClick={() => handleTenantAction('suspend', tenant.id, { reason: 'Suspenso pelo admin' })}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Suspender
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTenantAction('activate', tenant.id)}
                              className="text-green-400 hover:text-green-300 text-xs"
                            >
                              Ativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📈 Atividade Recente</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {activity.action === 'successful_login' ? '🔐' :
                     activity.action === 'create_session' ? '🎲' :
                     activity.action === 'tenant_registration' ? '📝' :
                     activity.action === 'tenant_approved' ? '✅' :
                     activity.action === 'send_invite' ? '📧' : '📋'}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {activity.user_name || 'Sistema'} - {activity.action}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {activity.tenant_name} • {formatDate(activity.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-slate-400 text-xs">
                  {activity.ip_address}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {/* Aba Usuários */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filtros de Usuários */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">👥 Gerenciamento de Usuários</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filtrar por Tenant:</label>
                <select
                  value={userFilters.tenant}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, tenant: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                >
                  <option value="all">Todos os Tenants</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Filtrar por Role:</label>
                <select
                  value={userFilters.role}
                  onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                >
                  <option value="all">Todos os Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">Usuário</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.tenant_name}</div>
                        <div className="text-sm text-slate-400">ID: {user.tenant_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' :
                           user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResetUserPassword(user.id, user.name)}
                            className="text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40 px-3 py-1 rounded text-xs"
                            title="Redefinir senha"
                          >
                            🔑 Senha
                          </button>
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-3 py-1 rounded text-xs"
                              title="Remover usuário"
                            >
                              🗑️ Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {allUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-slate-400">
                    <div className="text-4xl mb-4">👥</div>
                    <p>Nenhum usuário encontrado</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {revenueData.revenue_by_plan?.map((plan) => (
              <div key={plan.plan} className="bg-slate-800 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white capitalize">{plan.plan}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(plan.plan)}`}>
                    {plan.tenant_count} tenants
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(plan.monthly_revenue)}
                </div>
                <div className="text-slate-400 text-sm">por mês</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">💰 MRR Total: {formatCurrency(revenueData.total_mrr || 0)}</h3>
            
            <div className="space-y-4">
              <h4 className="text-md font-medium text-slate-300">Crescimento Mensal:</h4>
              {revenueData.monthly_growth?.slice(0, 6).map((month) => (
                <div key={month.month} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <span className="text-slate-300">{month.month}</span>
                  <div className="text-right">
                    <div className="text-white font-medium">{formatCurrency(month.monthly_mrr_added)}</div>
                    <div className="text-slate-400 text-sm">{month.new_tenants} novos tenants</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
