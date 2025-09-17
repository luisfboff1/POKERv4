// Serviço para gerenciar permissões de usuários
import { supabase } from './supabaseClient';

export const ADMIN_EMAIL = 'luisfboff@hotmail.com';

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor', 
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin'
};

// Verificar se o usuário atual é admin
export const isAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, is_approved')
      .eq('email', user.email)
      .single();
    
    if (error) {
      console.error('Erro ao verificar permissões de admin:', error);
      return false;
    }
    
    return data.role === ROLES.ADMIN && data.is_approved;
  } catch (err) {
    console.error('Erro ao verificar se é admin:', err);
    return false;
  }
};

// Verificar se o usuário tem permissão específica
export const hasPermission = async (permission) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, is_approved')
      .eq('email', user.email)
      .single();
    
    if (error || !data || !data.is_approved) {
      console.log('Usuário não aprovado ou erro:', error);
      return false;
    }
    
    switch (permission) {
      case PERMISSIONS.VIEW:
        return true; // Todos os usuários aprovados podem visualizar
      case PERMISSIONS.EDIT:
        return data.role === ROLES.EDITOR || data.role === ROLES.ADMIN;
      case PERMISSIONS.ADMIN:
        return data.role === ROLES.ADMIN;
      default:
        return false;
    }
  } catch (err) {
    console.error('Erro ao verificar permissão:', err);
    return false;
  }
};

// Obter informações do usuário atual
export const getCurrentUserInfo = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('email', user.email)
      .single();
    
    if (error) {
      console.error('Erro ao obter informações do usuário:', error);
      return null;
    }
    
    return {
      ...user,
      role: data.role,
      isApproved: data.is_approved,
      permissions: data
    };
  } catch (err) {
    console.error('Erro ao obter informações do usuário:', err);
    return null;
  }
};

// Listar todos os usuários (apenas para admins)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
    
    return data;
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    return [];
  }
};

// Aprovar usuário (apenas admin principal)
export const approveUser = async (userEmail, role = ROLES.VIEWER) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    // Verificar se é o admin principal
    if (user.email !== ADMIN_EMAIL) {
      throw new Error('Apenas o administrador principal pode aprovar usuários');
    }
    
    const { data, error } = await supabase
      .from('user_permissions')
      .update({ 
        is_approved: true,
        role: role,
        approved_at: new Date().toISOString(),
        approved_by: user.email
      })
      .eq('email', userEmail);
    
    if (error) {
      console.error('Erro ao aprovar usuário:', error);
      throw error;
    }
    
    console.log(`✅ Usuário ${userEmail} aprovado como ${role} por ${user.email}`);
    return data;
  } catch (err) {
    console.error('Erro ao aprovar usuário:', err);
    throw err;
  }
};

// Rejeitar usuário (apenas admin principal)
export const rejectUser = async (userEmail) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    // Verificar se é o admin principal
    if (user.email !== ADMIN_EMAIL) {
      throw new Error('Apenas o administrador principal pode rejeitar usuários');
    }
    
    const { data, error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('email', userEmail);
    
    if (error) {
      console.error('Erro ao rejeitar usuário:', error);
      throw error;
    }
    
    console.log(`❌ Usuário ${userEmail} rejeitado por ${user.email}`);
    return data;
  } catch (err) {
    console.error('Erro ao rejeitar usuário:', err);
    throw err;
  }
};

// Atualizar permissões de usuário (apenas admin principal)
export const updateUserPermissions = async (userEmail, newRole) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    // Verificar se é o admin principal
    if (user.email !== ADMIN_EMAIL) {
      throw new Error('Apenas o administrador principal pode alterar permissões');
    }
    
    const { data, error } = await supabase
      .from('user_permissions')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString(),
        updated_by: user.email
      })
      .eq('email', userEmail);
    
    if (error) {
      console.error('Erro ao atualizar permissões:', error);
      throw error;
    }
    
    console.log(`🔄 Permissão de ${userEmail} alterada para ${newRole} por ${user.email}`);
    return data;
  } catch (err) {
    console.error('Erro ao atualizar permissões:', err);
    throw err;
  }
};

// Criar entrada de permissão para novo usuário (sempre como VIEWER pendente)
export const createUserPermission = async (userEmail) => {
  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('user_permissions')
      .select('email')
      .eq('email', userEmail)
      .single();
    
    if (existing) {
      console.log('Usuário já existe na tabela de permissões');
      return existing;
    }
    
    // Criar novo usuário sempre como VIEWER pendente
    const { data, error } = await supabase
      .from('user_permissions')
      .insert({
        email: userEmail,
        role: ROLES.VIEWER, // Sempre VIEWER por padrão
        is_approved: false  // Sempre pendente de aprovação
      });
    
    if (error) {
      console.error('Erro ao criar permissão de usuário:', error);
      throw error;
    }
    
    console.log(`✅ Novo usuário criado: ${userEmail} como VIEWER (pendente)`);
    return data;
  } catch (err) {
    console.error('Erro ao criar permissão de usuário:', err);
    throw err;
  }
};

// Verificar se usuário está pendente de aprovação
export const isUserPending = async (userEmail) => {
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('is_approved')
      .eq('email', userEmail)
      .single();
    
    if (error) {
      // Se não encontrou, significa que é um novo usuário
      return true;
    }
    
    return !data.is_approved;
  } catch (err) {
    console.error('Erro ao verificar status do usuário:', err);
    return true;
  }
};

// Atualizar última aparição do usuário
export const updateLastSeen = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_permissions')
      .update({ last_seen: new Date().toISOString() })
      .eq('email', user.email);
    
    if (error) {
      console.error('Erro ao atualizar última aparição:', error);
    }
  } catch (err) {
    console.error('Erro ao atualizar última aparição:', err);
  }
};

// Obter estatísticas de usuários
export const getUserStats = async () => {
  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, is_approved, last_seen, created_at');
    
    if (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
    
    const stats = {
      total: data.length,
      approved: data.filter(u => u.is_approved).length,
      pending: data.filter(u => !u.is_approved).length,
      admins: data.filter(u => u.role === ROLES.ADMIN && u.is_approved).length,
      editors: data.filter(u => u.role === ROLES.EDITOR && u.is_approved).length,
      viewers: data.filter(u => u.role === ROLES.VIEWER && u.is_approved).length,
      activeToday: data.filter(u => {
        if (!u.last_seen) return false;
        const lastSeen = new Date(u.last_seen);
        const today = new Date();
        return lastSeen.toDateString() === today.toDateString();
      }).length
    };
    
    return stats;
  } catch (err) {
    console.error('Erro ao obter estatísticas:', err);
    return null;
  }
};
