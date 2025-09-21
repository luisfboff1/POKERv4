// API service para comunicação com o backend PHP - Atualizado para SaaS
const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = this.getStoredUser();
  }

  // Gerenciar token de autenticação
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  // Gerenciar dados do usuário
  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }

  getStoredUser() {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  getUser() {
    return this.user;
  }

  // Limpar dados de autenticação
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Se token expirou, limpar autenticação
      if (response.status === 401) {
        this.clearAuth();
        // Redirecionar para login se não estiver já lá
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // === AUTENTICAÇÃO ===
  async login(email, password) {
    const response = await this.request('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth.php?action=logout', { method: 'POST' });
    } catch (error) {
      console.warn('Erro no logout:', error);
    } finally {
      this.clearAuth();
    }
  }

  async verifyToken() {
    try {
      const response = await this.request('/auth.php?action=verify');
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      return response;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  async getProfile() {
    return this.request('/auth.php?action=profile');
  }

  // === REGISTRO ===
  async register(userData) {
    return this.request('/register.php', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // === SESSÕES ===
  async getSessions() {
    return this.request('/session.php');
  }

  async createSession(sessionData) {
    return this.request('/session.php', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  async updateSession(id, sessionData) {
    return this.request(`/session.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
  }

  async deleteSession(id) {
    return this.request(`/session.php?id=${id}`, {
      method: 'DELETE'
    });
  }

  // === JOGADORES ===
  async getPlayers() {
    return this.request('/players.php');
  }

  // === CONVITES ===
  async sendInvite(inviteData) {
    return this.request('/invite.php?action=send', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    });
  }

  async getInvites() {
    return this.request('/invite.php?action=list');
  }

  async getPendingInvites() {
    return this.request('/invite.php?action=pending');
  }

  async cancelInvite(inviteId) {
    return this.request(`/invite.php?action=cancel&id=${inviteId}`, {
      method: 'DELETE'
    });
  }

  // === SUPER ADMIN ===
  async getGlobalStats() {
    return this.request('/super_admin.php?action=stats');
  }

  async getAllTenants(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/super_admin.php?action=tenants&${params}`);
  }

  async getTenantDetails(tenantId) {
    return this.request(`/super_admin.php?action=tenant_details&tenant_id=${tenantId}`);
  }

  async getRecentActivity() {
    return this.request('/super_admin.php?action=recent_activity');
  }

  async getRevenueReport() {
    return this.request('/super_admin.php?action=revenue');
  }

  async suspendTenant(tenantId, reason) {
    return this.request('/super_admin.php?action=suspend_tenant', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId, reason })
    });
  }

  async activateTenant(tenantId) {
    return this.request('/super_admin.php?action=activate_tenant', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId })
    });
  }

  async changeTenantPlan(tenantId, plan) {
    return this.request('/super_admin.php?action=change_plan', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId, plan })
    });
  }

  // === UTILITÁRIOS ===
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  }

  isSuperAdmin() {
    const user = this.getUser();
    return user && user.role === 'super_admin';
  }

  isTenantAdmin() {
    const user = this.getUser();
    return user && (user.role === 'admin' || user.role === 'super_admin');
  }

  getTenantInfo() {
    const user = this.getUser();
    return user ? {
      id: user.tenant_id,
      name: user.tenant_name,
      plan: user.tenant_plan
    } : null;
  },

  // User Management APIs
  getAllUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/super_admin.php?action=users&${params}`);
  },

  deleteUser(userId) {
    return this.request('/super_admin.php?action=delete_user', 'POST', { user_id: userId });
  },

  resetUserPassword(userId, newPassword) {
    return this.request('/super_admin.php?action=reset_password', 'POST', { 
      user_id: userId, 
      new_password: newPassword 
    });
  },

  // Group Member Management APIs (for tenant admins)
  getGroupMembers() {
    return this.request('/invite.php?action=members');
  },

  removeMemberFromGroup(userId) {
    return this.request('/invite.php?action=remove_member', 'POST', { user_id: userId });
  },

  resetMemberPassword(userId, newPassword) {
    return this.request('/invite.php?action=reset_member_password', 'POST', { 
      user_id: userId, 
      new_password: newPassword 
    });
  }
}

export const api = new ApiService();