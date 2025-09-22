# 🎯 **GUIA PARA ALINHAMENTO PERFEITO - SISTEMA SAAS**

## 📋 **OPÇÃO 1: DOCUMENTOS EXISTENTES**

### **📁 Estrutura Detalhada das Pastas**

#### **Frontend (React)**
```
src/
├── contexts/                    # Estado global da aplicação
│   ├── AuthContext.jsx         # Autenticação e autorização
│   └── AgentContext.jsx        # PokerBot Agente IA
├── components/                  # Componentes reutilizáveis
│   ├── Layout/                 # Layout principal autenticado
│   ├── ProtectedRoute/         # Controle de acesso por roles
│   ├── PokerBot/               # Interface do agente IA
│   ├── SessionManager/         # Gerenciamento de sessões
│   └── ErrorBoundary/          # Tratamento de erros React
├── pages/                      # Páginas da aplicação
│   ├── Login/                  # Página de login
│   ├── Register/               # Registro de novos tenants
│   ├── Home/                   # Dashboard principal
│   ├── NewSession/             # Criar nova sessão
│   ├── History/                # Histórico de sessões
│   ├── Ranking/                # Rankings e estatísticas
│   ├── Invites/                # Gerenciar convites
│   ├── SuperAdmin/             # Dashboard super admin
│   └── AcceptInvite/           # Aceitar convites via email
└── services/                   # Cliente HTTP para APIs
    └── api.js                  # Cliente HTTP para todas as APIs
```

#### **Backend (PHP Multi-Tenant)**
```
api/
├── config.php                  # Configuração do banco + CORS
├── jwt_helper.php              # Geração e validação de JWT
├── middleware/                 # Middleware de autenticação
│   └── auth_middleware.php     # Auth e autorização por roles
├── auth.php                    # Sistema de autenticação
├── register.php                # Registro de novos tenants
├── approve.php                 # Aprovação de tenants
├── session.php                 # CRUD de sessões (filtrado por tenant)
├── players.php                 # API de jogadores únicos
├── invite.php                  # Sistema de convites
├── accept_invite.php           # Processar convites via email
├── super_admin.php             # Dashboard e APIs do super admin
├── agent.php                   # APIs do PokerBot Agente
├── pdf_generator.php           # Geração de relatórios PDF
├── email_config.php            # Configuração SMTP e templates
├── setup_saas.sql              # Script de criação do banco multi-tenant
├── migration_existing_data.sql # Migração de dados antigos
├── update_roles.sql            # Atualização de roles
└── composer.json               # Dependências PHP (PHPMailer)
```

---

## 🎯 **OPÇÃO 2: PROMPT ESPECÍFICO**

### **🔧 Como Organizar os Componentes**

#### **1. Padrão de Nomenclatura:**
```javascript
// Componentes: PascalCase
- AuthContext.jsx
- ProtectedRoute.jsx
- SessionManager.jsx

// Páginas: PascalCase com index.jsx
- Home/index.jsx
- Login/index.jsx
- SuperAdmin/index.jsx

// Hooks: camelCase com "use"
- useAuth()
- useAgent()
- useSession()

// APIs: snake_case
- auth.php
- session.php
- super_admin.php
```

#### **2. Estrutura de Componentes:**
```javascript
// Padrão para todos os componentes
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export function ComponentName() {
  // 1. Estados locais
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 2. Contextos
  const { user, isAuthenticated } = useAuth();
  
  // 3. useEffect para carregar dados
  useEffect(() => {
    loadData();
  }, []);
  
  // 4. Funções
  const loadData = async () => {
    // Implementação
  };
  
  // 5. Render
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### **📄 Estrutura das Páginas**

#### **1. Página Padrão:**
```javascript
// pages/Home/index.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export function Home() {
  // Estados específicos da página
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  
  // Contexto de autenticação
  const { user, getTenantInfo, isTenantAdmin } = useAuth();
  
  // Carregar dados ao montar componente
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  // Funções da página
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.getSessions();
      setRecentSessions(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render com loading e error states
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div className="p-6 space-y-6">
      {/* Conteúdo da página */}
    </div>
  );
}
```

#### **2. Páginas com Proteção:**
```javascript
// pages/SuperAdmin/index.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

export function SuperAdmin() {
  const { user, isSuperAdmin } = useAuth();
  
  // Verificação de acesso
  if (!isSuperAdmin()) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">
          Acesso Negado
        </div>
        <p className="text-gray-600">
          Apenas super administradores podem acessar esta área.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Dashboard Super Admin */}
    </div>
  );
}
```

### **🔐 Padrões de Autenticação**

#### **1. Context de Autenticação:**
```javascript
// contexts/AuthContext.jsx
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
      if (!api.getToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.verifyToken();
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      api.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  // Funções de autenticação
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

  // Verificações de roles
  const isSuperAdmin = () => {
    const currentUser = user || api.getUser();
    return currentUser && currentUser.role === 'super_admin';
  };

  const isTenantAdmin = () => {
    const currentUser = user || api.getUser();
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');
  };

  const value = {
    user, loading, error,
    login, logout, register,
    isAuthenticated: () => !!user && !!api.getToken(),
    isSuperAdmin, isTenantAdmin,
    getTenantInfo: () => user ? { id: user.tenant_id, name: user.tenant_name } : null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### **2. Componente de Proteção:**
```javascript
// components/ProtectedRoute/index.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireRole = null,
  requireSuperAdmin = false 
}) {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth();

  if (loading) {
    return <div>Verificando autenticação...</div>;
  }

  // Rota que NÃO requer autenticação (login, register)
  if (!requireAuth) {
    return isAuthenticated() ? <Navigate to="/" replace /> : children;
  }

  // Rota que requer autenticação
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Verificação de role específico
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  // Verificação de super admin
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

### **🔧 Organização das APIs**

#### **1. Estrutura Padrão de API PHP:**
```php
<?php
// api/session.php
require_once 'config.php';
require_once 'middleware/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($endpoint === 'list') {
            handleGetSessions();
        } elseif ($endpoint === 'single') {
            handleGetSession();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    case 'POST':
        if ($endpoint === 'create') {
            handleCreateSession();
        } elseif ($endpoint === 'update') {
            handleUpdateSession();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    case 'DELETE':
        if ($endpoint === 'delete') {
            handleDeleteSession();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    default:
        error('Método não permitido', 405);
}

function handleGetSessions() {
    try {
        // 1. Verificar autenticação
        $current_user = requireAuth();
        
        // 2. Buscar dados (já filtrado por tenant_id)
        $stmt = $pdo->prepare("
            SELECT * FROM sessions 
            WHERE tenant_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$current_user['tenant_id']]);
        $sessions = $stmt->fetchAll();
        
        // 3. Retornar resposta
        success($sessions);
        
    } catch (Exception $e) {
        error('Erro ao buscar sessões: ' . $e->getMessage());
    }
}

function handleCreateSession() {
    try {
        // 1. Verificar autenticação e permissões
        $current_user = requireAuth();
        requireTenantAdmin($current_user);
        
        // 2. Validar dados de entrada
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['date']) || !isset($input['players_data'])) {
            error('Dados obrigatórios não fornecidos', 400);
        }
        
        // 3. Inserir no banco (com tenant_id automático)
        $stmt = $pdo->prepare("
            INSERT INTO sessions (tenant_id, date, players_data, created_by) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $current_user['tenant_id'],
            $input['date'],
            json_encode($input['players_data']),
            $current_user['id']
        ]);
        
        $session_id = $pdo->lastInsertId();
        
        // 4. Retornar resposta
        success(['id' => $session_id, 'message' => 'Sessão criada com sucesso']);
        
    } catch (Exception $e) {
        error('Erro ao criar sessão: ' . $e->getMessage());
    }
}
?>
```

#### **2. Middleware de Autenticação:**
```php
<?php
// api/middleware/auth_middleware.php
function requireAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        error('Token de autenticação não fornecido', 401);
    }
    
    try {
        $payload = JWTHelper::verifyToken($token);
        $user = getUserById($payload['user_id']);
        
        if (!$user || !$user['is_active']) {
            error('Usuário inválido ou inativo', 401);
        }
        
        return $user;
    } catch (Exception $e) {
        error('Token inválido: ' . $e->getMessage(), 401);
    }
}

function requireTenantAdmin($user) {
    if (!in_array($user['role'], ['admin', 'super_admin'])) {
        error('Acesso negado. Apenas administradores podem realizar esta ação', 403);
    }
}

function requireSuperAdmin($user) {
    if ($user['role'] !== 'super_admin') {
        error('Acesso negado. Apenas super administradores podem realizar esta ação', 403);
    }
}

function getBearerToken() {
    $headers = getallheaders();
    $auth_header = $headers['Authorization'] ?? '';
    
    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
        return $matches[1];
    }
    
    return null;
}
?>
```

---

## 🎯 **OPÇÃO 3: EXEMPLOS DE CÓDIGO**

### **🔐 AuthContext Completo**
```javascript
// contexts/AuthContext.jsx
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

  // Verificar roles
  const isAuthenticated = () => {
    return !!user && !!api.getToken();
  };

  const isSuperAdmin = () => {
    const currentUser = user || api.getUser();
    return currentUser && currentUser.role === 'super_admin';
  };

  const isTenantAdmin = () => {
    const currentUser = user || api.getUser();
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');
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
    user, loading, error,
    
    // Ações
    login, logout, register, updateProfile, checkAuth,
    
    // Verificações
    isAuthenticated, isSuperAdmin, isTenantAdmin, getTenantInfo,
    
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
```

### **🤖 AgentContext Completo**
```javascript
// contexts/AgentContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

const AgentContext = createContext();

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent deve ser usado dentro de AgentProvider');
  }
  return context;
};

export const AgentProvider = ({ children }) => {
  const [agentStatus, setAgentStatus] = useState('online');
  const [currentAction, setCurrentAction] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [agentCapabilities, setAgentCapabilities] = useState({
    canCreateSessions: true,
    canEditSessions: true,
    canGeneratePDFs: true,
    canAnalyzeData: true,
    canDebugSystem: true,
    canManageUsers: false,
  });

  // Executar ação do agente
  const executeAction = useCallback(async (actionType, parameters = {}) => {
    setAgentStatus('processing');
    setCurrentAction({ type: actionType, parameters, startTime: new Date() });

    try {
      let result;
      
      switch (actionType) {
        case 'create_session':
          result = await createSession(parameters);
          break;
        case 'generate_pdf':
          result = await generatePDF(parameters);
          break;
        case 'analyze_data':
          result = await analyzeData(parameters);
          break;
        default:
          throw new Error(`Ação não reconhecida: ${actionType}`);
      }

      // Adicionar ao histórico
      setActionHistory(prev => [...prev, {
        id: Date.now(),
        type: actionType,
        parameters,
        result,
        timestamp: new Date(),
        success: true
      }]);

      setAgentStatus('online');
      setCurrentAction(null);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao executar ação do agente:', error);
      
      setActionHistory(prev => [...prev, {
        id: Date.now(),
        type: actionType,
        parameters,
        error: error.message,
        timestamp: new Date(),
        success: false
      }]);

      setAgentStatus('online');
      setCurrentAction(null);
      
      return { success: false, error: error.message };
    }
  }, []);

  // Interpretar comando de texto em ação
  const interpretCommand = useCallback((command) => {
    const commandLower = command.toLowerCase();
    
    // Criar sessão
    if (commandLower.includes('criar sessão') || commandLower.includes('nova sessão')) {
      return {
        type: 'create_session',
        confidence: 0.9,
        parameters: extractSessionParams(command)
      };
    }
    
    // Gerar PDF
    if (commandLower.includes('gerar pdf') || commandLower.includes('exportar pdf')) {
      return {
        type: 'generate_pdf',
        confidence: 0.8,
        parameters: extractPDFParams(command)
      };
    }
    
    return null;
  }, []);

  const value = {
    // Estado
    agentStatus, currentAction, actionHistory, agentCapabilities,
    
    // Ações
    executeAction, interpretCommand, clearHistory: () => setActionHistory([]),
    
    // Setters
    setAgentCapabilities
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};
```

### **🔧 API Service Completo**
```javascript
// services/api.js
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

  // Método base para requisições
  async request(endpoint, options = {}) {
    const url = `${API_BASE}/${endpoint}`;
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error('Erro na API:', error);
      throw error;
    }
  }

  // Autenticação
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro no login');
    }

    this.setToken(data.data.token);
    this.setUser(data.data.user);
    
    return data;
  }

  async logout() {
    try {
      await this.request('auth.php?action=logout', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  }

  async verifyToken() {
    return await this.request('auth.php?action=verify');
  }

  // Sessões
  async getSessions() {
    return await this.request('session.php?action=list');
  }

  async createSession(sessionData) {
    return await this.request('session.php?action=create', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  async updateSession(sessionId, updates) {
    return await this.request(`session.php?action=update&id=${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(updates)
    });
  }

  async deleteSession(sessionId) {
    return await this.request(`session.php?action=delete&id=${sessionId}`, {
      method: 'DELETE'
    });
  }

  // Super Admin
  async getTenants() {
    return await this.request('super_admin.php?action=tenants');
  }

  async approveTenant(tenantId) {
    return await this.request(`approve.php?action=approve&id=${tenantId}`, {
      method: 'POST'
    });
  }

  // Convites
  async sendInvite(inviteData) {
    return await this.request('invite.php?action=send', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    });
  }

  async getInvites() {
    return await this.request('invite.php?action=list');
  }
}

export const api = new ApiService();
export default api;
```

### **📄 Estrutura das Páginas**

#### **1. Página de Login:**
```javascript
// pages/Login/index.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, error, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await login(email, password);
      // Redirecionamento será feito automaticamente pelo AuthContext
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar na sua conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### **2. Página Home (Dashboard):**
```javascript
// pages/Home/index.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export function Home() {
  const { user, getTenantInfo, isTenantAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const tenantInfo = getTenantInfo();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const sessionsResponse = await api.getSessions();
      const sessions = sessionsResponse.data || [];
      
      // Calcular estatísticas
      const totalSessions = sessions.length;
      const thisMonthSessions = sessions.filter(session => {
        const sessionDate = new Date(session.created_at);
        const now = new Date();
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalSessions,
        thisMonthSessions,
        totalPlayers: new Set(sessions.flatMap(s => 
          JSON.parse(s.players_data).map(p => p.name)
        )).size
      });

      setRecentSessions(sessions.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {user?.name}!
          </h1>
          <p className="text-gray-600">
            {tenantInfo?.name} • Plano {tenantInfo?.plan}
          </p>
        </div>
        {isTenantAdmin() && (
          <Link
            to="/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Nova Sessão
          </Link>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total de Sessões</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats?.totalSessions || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Sessões Este Mês</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.thisMonthSessions || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Jogadores Únicos</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.totalPlayers || 0}</p>
        </div>
      </div>

      {/* Sessões Recentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sessões Recentes</h2>
        </div>
        <div className="p-6">
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma sessão encontrada. {isTenantAdmin() && 'Crie sua primeira sessão!'}
            </p>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Sessão #{session.id}</h3>
                    <p className="text-gray-600">
                      {new Date(session.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {JSON.parse(session.players_data).length} jogadores
                    </p>
                    <Link
                      to={`/session/${session.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### **🔧 Estrutura das APIs PHP**

#### **1. API de Sessões:**
```php
<?php
// api/session.php
require_once 'config.php';
require_once 'middleware/auth_middleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($endpoint === 'list') {
            handleGetSessions();
        } elseif ($endpoint === 'single') {
            handleGetSession();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    case 'POST':
        if ($endpoint === 'create') {
            handleCreateSession();
        } elseif ($endpoint === 'update') {
            handleUpdateSession();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    case 'DELETE':
        if ($endpoint === 'delete') {
            handleDeleteSession();
        } else {
            error('Endpoint não encontrado', 404);
        }
        break;
        
    default:
        error('Método não permitido', 405);
}

function handleGetSessions() {
    try {
        // 1. Verificar autenticação
        $current_user = requireAuth();
        
        // 2. Buscar dados (já filtrado por tenant_id)
        $stmt = $pdo->prepare("
            SELECT s.*, u.name as created_by_name 
            FROM sessions s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.tenant_id = ? 
            ORDER BY s.created_at DESC
        ");
        $stmt->execute([$current_user['tenant_id']]);
        $sessions = $stmt->fetchAll();
        
        // 3. Processar dados
        foreach ($sessions as &$session) {
            $session['players_data'] = json_decode($session['players_data'], true);
            $session['recommendations'] = json_decode($session['recommendations'], true);
        }
        
        // 4. Retornar resposta
        success($sessions);
        
    } catch (Exception $e) {
        error('Erro ao buscar sessões: ' . $e->getMessage());
    }
}

function handleCreateSession() {
    try {
        // 1. Verificar autenticação e permissões
        $current_user = requireAuth();
        requireTenantAdmin($current_user);
        
        // 2. Validar dados de entrada
        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['date']) || !isset($input['players_data'])) {
            error('Dados obrigatórios não fornecidos', 400);
        }
        
        // 3. Validar estrutura dos dados
        if (!is_array($input['players_data']) || empty($input['players_data'])) {
            error('Dados dos jogadores inválidos', 400);
        }
        
        // 4. Inserir no banco (com tenant_id automático)
        $stmt = $pdo->prepare("
            INSERT INTO sessions (tenant_id, date, players_data, recommendations, created_by) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $players_json = json_encode($input['players_data']);
        $recommendations_json = json_encode($input['recommendations'] ?? []);
        
        $stmt->execute([
            $current_user['tenant_id'],
            $input['date'],
            $players_json,
            $recommendations_json,
            $current_user['id']
        ]);
        
        $session_id = $pdo->lastInsertId();
        
        // 5. Log de auditoria
        auditLog($current_user, 'CREATE', 'sessions', $session_id, null, $input);
        
        // 6. Retornar resposta
        success([
            'id' => $session_id, 
            'message' => 'Sessão criada com sucesso',
            'data' => $input
        ]);
        
    } catch (Exception $e) {
        error('Erro ao criar sessão: ' . $e->getMessage());
    }
}

function handleUpdateSession() {
    try {
        // 1. Verificar autenticação e permissões
        $current_user = requireAuth();
        requireTenantAdmin($current_user);
        
        // 2. Validar ID da sessão
        $session_id = $_GET['id'] ?? null;
        if (!$session_id) {
            error('ID da sessão não fornecido', 400);
        }
        
        // 3. Verificar se a sessão pertence ao tenant
        $stmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$session_id, $current_user['tenant_id']]);
        $existing_session = $stmt->fetch();
        
        if (!$existing_session) {
            error('Sessão não encontrada', 404);
        }
        
        // 4. Obter dados antigos para auditoria
        $old_data = [
            'players_data' => json_decode($existing_session['players_data'], true),
            'recommendations' => json_decode($existing_session['recommendations'], true)
        ];
        
        // 5. Validar dados de entrada
        $input = json_decode(file_get_contents('php://input'), true);
        
        // 6. Atualizar apenas campos fornecidos
        $update_fields = [];
        $update_values = [];
        
        if (isset($input['players_data'])) {
            $update_fields[] = 'players_data = ?';
            $update_values[] = json_encode($input['players_data']);
        }
        
        if (isset($input['recommendations'])) {
            $update_fields[] = 'recommendations = ?';
            $update_values[] = json_encode($input['recommendations']);
        }
        
        if (isset($input['date'])) {
            $update_fields[] = 'date = ?';
            $update_values[] = $input['date'];
        }
        
        if (empty($update_fields)) {
            error('Nenhum campo para atualizar fornecido', 400);
        }
        
        // 7. Executar atualização
        $update_values[] = $session_id;
        $update_values[] = $current_user['tenant_id'];
        
        $stmt = $pdo->prepare("
            UPDATE sessions 
            SET " . implode(', ', $update_fields) . ", updated_at = NOW()
            WHERE id = ? AND tenant_id = ?
        ");
        $stmt->execute($update_values);
        
        // 8. Log de auditoria
        auditLog($current_user, 'UPDATE', 'sessions', $session_id, $old_data, $input);
        
        // 9. Retornar resposta
        success([
            'id' => $session_id,
            'message' => 'Sessão atualizada com sucesso'
        ]);
        
    } catch (Exception $e) {
        error('Erro ao atualizar sessão: ' . $e->getMessage());
    }
}

function handleDeleteSession() {
    try {
        // 1. Verificar autenticação e permissões
        $current_user = requireAuth();
        requireTenantAdmin($current_user);
        
        // 2. Validar ID da sessão
        $session_id = $_GET['id'] ?? null;
        if (!$session_id) {
            error('ID da sessão não fornecido', 400);
        }
        
        // 3. Verificar se a sessão pertence ao tenant
        $stmt = $pdo->prepare("SELECT * FROM sessions WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$session_id, $current_user['tenant_id']]);
        $session = $stmt->fetch();
        
        if (!$session) {
            error('Sessão não encontrada', 404);
        }
        
        // 4. Log de auditoria (antes de deletar)
        auditLog($current_user, 'DELETE', 'sessions', $session_id, $session, null);
        
        // 5. Deletar sessão
        $stmt = $pdo->prepare("DELETE FROM sessions WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$session_id, $current_user['tenant_id']]);
        
        // 6. Retornar resposta
        success(['message' => 'Sessão deletada com sucesso']);
        
    } catch (Exception $e) {
        error('Erro ao deletar sessão: ' . $e->getMessage());
    }
}
?>
```

---

## 🎯 **RESUMO PARA ALINHAMENTO PERFEITO**

### **✅ Padrões Estabelecidos:**

1. **Estrutura de Pastas**: Hierarquia clara com separação de responsabilidades
2. **Nomenclatura**: PascalCase para componentes, camelCase para funções, snake_case para APIs
3. **Contextos**: AuthContext e AgentContext para estado global
4. **APIs**: Estrutura consistente com middleware de autenticação
5. **Componentes**: Padrão de loading, error e success states
6. **Segurança**: Filtros por tenant_id em todas as queries
7. **Auditoria**: Logs de todas as ações críticas

### **🔧 Checklist de Implementação:**

- [ ] Estrutura de pastas seguindo o padrão
- [ ] AuthContext configurado corretamente
- [ ] AgentContext implementado (se necessário)
- [ ] APIs PHP com middleware de autenticação
- [ ] Componentes com estados de loading/error
- [ ] Proteção de rotas implementada
- [ ] Filtros por tenant_id em todas as queries
- [ ] Logs de auditoria funcionando
- [ ] Tratamento de erros consistente
- [ ] Documentação atualizada

**🎯 Com este guia, você tem tudo necessário para replicar exatamente a arquitetura e padrões do sistema SaaS!**
