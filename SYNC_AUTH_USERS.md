# Sync Supabase Auth Users with Application Database

## Problem

After successfully fixing the schema permissions, you might encounter a new error:

```json
{"error":"User not found"}
```

This happens when:
1. ✅ User successfully authenticates with Supabase Auth
2. ✅ Receives a valid JWT token
3. ❌ But no matching record exists in `poker.users` table

## Understanding the Architecture

This application uses **two separate user tables**:

1. **`auth.users`** (Supabase Auth) - Handles authentication, passwords, OAuth
2. **`poker.users`** (Application) - Stores business logic: tenant association, roles, player links

Both tables must have matching records with the same email.

## Solution: Create Missing User Records

### Step 1: Check Current Situation

```sql
-- Check what's in Supabase Auth
SELECT email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Check what's in application database
SELECT email, name, role, tenant_id 
FROM poker.users 
ORDER BY created_at DESC;
```

### Step 2: Create Tenant (if needed)

If you don't have a tenant yet:

```sql
INSERT INTO poker.tenants (name, email, plan, status, max_users, max_sessions_per_month, approved_at)
VALUES (
  'Meu Grupo de Poker',           -- Nome do seu grupo
  'seu-email@exemplo.com',         -- Seu email
  'basic',                         -- Plano: basic, premium, enterprise
  'active',                        -- Status: active
  10,                             -- Máximo de usuários
  50,                             -- Máximo de sessões por mês
  NOW()                           -- Aprovado agora
)
ON CONFLICT (email) DO NOTHING
RETURNING id, name, email;
```

### Step 3: Create User Record

```sql
-- Criar usuário admin para o tenant
INSERT INTO poker.users (tenant_id, name, email, password_hash, role, is_active)
VALUES (
  (SELECT id FROM poker.tenants WHERE email = 'seu-email@exemplo.com'), -- ID do tenant
  'Seu Nome Completo',           -- Nome
  'seu-email@exemplo.com',        -- Email (DEVE ser o mesmo do Supabase Auth)
  '',                            -- Deixe vazio - Supabase Auth gerencia senhas
  'admin',                       -- Role: admin, player, super_admin
  true                           -- Ativo
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email, role, tenant_id;
```

### Step 4: Verify Sync

```sql
-- Verificar se usuário existe em ambas tabelas
SELECT 
  au.email as auth_email,
  au.created_at as auth_created,
  pu.email as app_email,
  pu.name as app_name,
  pu.role,
  pu.tenant_id,
  t.name as tenant_name
FROM auth.users au
LEFT JOIN poker.users pu ON au.email = pu.email
LEFT JOIN poker.tenants t ON pu.tenant_id = t.id
WHERE au.email = 'seu-email@exemplo.com';
```

Expected result:
- All columns should have values (no NULLs except in `pu.*` columns)
- `auth_email` = `app_email`

### Step 5: Test Login

1. Clear browser cache
2. Go to login page
3. Enter credentials
4. Should successfully redirect to dashboard ✅

## Automatic Sync (Future Enhancement)

To prevent this issue for new users, you could implement an automatic sync:

### Option A: Database Trigger (Recommended)

```sql
-- Create function to auto-create poker.users when auth.users is created
CREATE OR REPLACE FUNCTION poker.sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if email doesn't already exist in poker.users
  IF NOT EXISTS (SELECT 1 FROM poker.users WHERE email = NEW.email) THEN
    -- Create a default tenant for the user if needed
    INSERT INTO poker.tenants (name, email, plan, status, approved_at)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Grupo'),
      NEW.email,
      'basic',
      'pending',  -- Requires approval
      NULL
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Create user record
    INSERT INTO poker.users (
      tenant_id,
      name,
      email,
      password_hash,
      role,
      is_active
    )
    VALUES (
      (SELECT id FROM poker.tenants WHERE email = NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
      NEW.email,
      '',
      'admin',
      true
    )
    ON CONFLICT (email) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION poker.sync_auth_user();
```

### Option B: Application Code (Alternative)

Modify `/app/api/auth/register/route.ts` to create both records in a transaction.

## Common Issues

### Issue 1: Email Mismatch

**Symptom:** User can log in but gets "User not found"

**Solution:**
```sql
-- Check for email mismatches
SELECT au.email as auth_email, pu.email as app_email
FROM auth.users au
LEFT JOIN poker.users pu ON au.email = pu.email
WHERE pu.email IS NULL;
```

### Issue 2: Inactive User

**Symptom:** User found but can't access

**Solution:**
```sql
-- Activate user
UPDATE poker.users 
SET is_active = true 
WHERE email = 'seu-email@exemplo.com';
```

### Issue 3: Tenant Not Active

**Symptom:** User found but tenant is pending/suspended

**Solution:**
```sql
-- Activate tenant
UPDATE poker.tenants 
SET status = 'active', approved_at = NOW() 
WHERE email = 'seu-email@exemplo.com';
```

### Issue 4: Wrong Tenant Association

**Symptom:** User can't see their data

**Solution:**
```sql
-- Check tenant association
SELECT u.email, u.tenant_id, t.name as tenant_name, t.status
FROM poker.users u
JOIN poker.tenants t ON u.tenant_id = t.id
WHERE u.email = 'seu-email@exemplo.com';

-- Fix if needed
UPDATE poker.users 
SET tenant_id = (SELECT id FROM poker.tenants WHERE email = 'correct-email@exemplo.com')
WHERE email = 'seu-email@exemplo.com';
```

## Quick Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `permission denied for schema poker` | Missing PostgreSQL grants | Run `db/fix_poker_schema_permissions.sql` |
| `User not found` (404) | No record in `poker.users` | Create user record (Step 3 above) |
| `Usuário não encontrado` (login) | No record in `poker.users` | Create user record (Step 3 above) |
| `Conta pendente de aprovação` | Tenant status = 'pending' | Activate tenant (Issue 3 above) |
| Can't see data | Wrong tenant_id | Fix tenant association (Issue 4 above) |

## Prevention Checklist

For new installations:

- [ ] Run `db/supabase-schema.sql` to create schema
- [ ] Run `db/fix_poker_schema_permissions.sql` to set permissions
- [ ] Update default user email in schema to match your email
- [ ] OR manually create tenant + user after first Supabase Auth signup
- [ ] Consider implementing automatic sync (Option A or B)

## Related Files

- `app/api/auth/login/route.ts` - Login logic that checks both tables
- `app/api/auth/user/route.ts` - User fetch logic that queries `poker.users`
- `db/supabase-schema.sql` - Schema with default user creation
- `FIX_SCHEMA_PERMISSIONS.md` - Permission issues (previous step)
