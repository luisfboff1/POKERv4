-- ============================================================================
-- Migration: Remove user_sessions table (JWT customizado eliminado)
-- Data: 2025-10-23
-- Descrição: Remove a tabela user_sessions pois agora usamos apenas Supabase Auth
--            Não há mais necessidade de gerenciar sessões manualmente
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_tenant_id;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_token;

-- Drop the table
DROP TABLE IF EXISTS user_sessions;

-- ============================================================================
-- Explicação da Mudança
-- ============================================================================
-- 
-- ANTES (JWT Customizado):
-- - Geravamos tokens JWT com 'jose'
-- - Secret hardcoded como fallback (VULNERABILIDADE CRÍTICA)
-- - Expiração de 24 horas
-- - Tabela user_sessions para rastreamento/revogação manual
-- - Hash dos tokens armazenados
-- 
-- AGORA (Supabase Auth):
-- - Tokens gerados pelo Supabase (secrets seguros)
-- - Access token: 1 hora
-- - Refresh token: 30 dias (renovação automática)
-- - Revogação automática pelo Supabase
-- - Sem necessidade de tabela custom
-- - MFA, OAuth, rate limiting built-in
-- 
-- BENEFÍCIOS DE SEGURANÇA:
-- ✅ Elimina vulnerabilidade de secret hardcoded
-- ✅ Tokens de curta duração (1h vs 24h)
-- ✅ Refresh automático de sessões
-- ✅ Gestão profissional de secrets
-- ✅ Auditoria e logs integrados
-- ✅ Conformidade SOC 2, ISO 27001
-- ✅ RLS policies em nível de banco
-- 
-- ============================================================================
