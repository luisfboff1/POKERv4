# GitHub Copilot Instructions

## Project Overview

This is a **Poker SaaS Multi-Tenant System** built with:
- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Supabase** (Auth + PostgreSQL database)
- **Tailwind CSS 4** for styling
- **Multi-tenant architecture** with Row Level Security (RLS)

---

## 🚨 CRITICAL RULES

### 1. Database Changes - ALWAYS Use Migrations

**NEVER execute SQL directly in Supabase Dashboard for structural changes!**

```powershell
# ✅ CORRECT: Use migrations
supabase migration new add_column_name
# Edit generated file in supabase/migrations/
supabase db push --project-ref jhodhxvvhohygijqcxbo

# ❌ WRONG: Direct SQL in Dashboard
ALTER TABLE poker.users ADD COLUMN phone VARCHAR(20);
```

**Why?**
- ✅ Version control (tracked in Git)
- ✅ Rollback capability
- ✅ Team collaboration
- ✅ CI/CD integration
- ✅ Prevents manual errors

**Database Info:**
```
Project Ref: jhodhxvvhohygijqcxbo
Schema: poker
Host: aws-1-sa-east-1.pooler.supabase.com
```

**Full Guide:** `db/MIGRATION_WORKFLOW.md`

---

### 2. Multi-Tenant Isolation

**ALWAYS filter by `tenant_id`** in all queries:

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('sessions')
  .select('*')
  .eq('tenant_id', user.tenant_id);

// ❌ WRONG - Exposes all tenants data
const { data } = await supabase
  .from('sessions')
  .select('*');
```

---

### 3. Authentication

Use Supabase Auth for all authentication:

```typescript
// Login
const { data } = await supabase.auth.signInWithPassword({ email, password });

// Logout
await supabase.auth.signOut();

// Get session
const { data: { session } } = await supabase.auth.getSession();
```

**Never** implement custom JWT auth - use Supabase Auth only.

---

## Code Style Guidelines

### TypeScript
- Always use `const` (never `let` or `var`)
- Use proper TypeScript types (import from `lib/types.ts`)
- Enable strict mode
- No `any` types unless absolutely necessary

### React Components
- Functional components only
- Use hooks (`useState`, `useEffect`, etc.)
- Server Components by default (App Router)
- Client Components only when needed (`'use client'`)

### API Routes
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth';

export async function GET(req: NextRequest) {
  const authData = await requireAuth(req);
  if (!authData.authenticated) {
    return NextResponse.json(authData.response, { status: 401 });
  }

  // Always filter by tenant_id
  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('tenant_id', authData.user.tenant_id);

  return NextResponse.json({ success: true, data });
}
```

### Error Handling
```typescript
try {
  const result = await someOperation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { success: false, error: 'User-friendly message' },
    { status: 500 }
  );
}
```

---

## File Structure

```
app/
├── api/                    # API Routes (server-side)
│   ├── auth/
│   ├── sessions/
│   ├── players/
│   └── invites/
├── dashboard/              # Protected pages
├── login/
└── register/

lib/
├── supabase-auth.ts        # Auth helpers (requireAuth, etc.)
├── supabaseServer.ts       # Supabase client
├── types.ts                # TypeScript types
└── utils.ts

components/
├── ui/                     # Base UI components
└── [feature-components]/

db/
├── migrations/             # Supabase migrations (NEVER delete)
├── backups/                # Database backups (pg_dump)
└── MIGRATION_WORKFLOW.md   # Migration guide
```

---

## Common Patterns

### Protected Route (Server Component)
```typescript
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function DashboardPage() {
  const { data: { session } } = await supabaseServer.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  return <div>Dashboard content</div>;
}
```

### API Route with Auth
```typescript
import { requireAuth } from '@/lib/supabase-auth';

export async function POST(req: NextRequest) {
  const authData = await requireAuth(req);
  if (!authData.authenticated) {
    return NextResponse.json(authData.response, { status: 401 });
  }

  // Use authData.user for tenant_id, role, etc.
  const { tenant_id, role } = authData.user;
}
```

### Database Query with RLS
```typescript
// RLS policies automatically filter by tenant_id
const { data, error } = await supabase
  .from('poker.sessions')
  .select('*')
  .order('date', { ascending: false });
```

---

## Database Schema (poker schema)

Tables:
- `poker.tenants` - Tenant/group information
- `poker.users` - System users (linked to Supabase Auth)
- `poker.players` - Poker players (may have user accounts)
- `poker.sessions` - Poker sessions with buy-ins/cash-outs
- `poker.player_transfers` - Individual transfers
- `poker.user_invites` - Email invitations
- `poker.audit_logs` - Audit trail

All tables have:
- `tenant_id` for multi-tenant isolation
- RLS policies for security
- Timestamps (`created_at`, `updated_at`)

---

## Migration Examples

### Add Column
```powershell
supabase migration new add_phone_to_users
```
```sql
-- supabase/migrations/TIMESTAMP_add_phone_to_users.sql
ALTER TABLE poker.users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_users_phone ON poker.users(phone);
```

### Create Table
```powershell
supabase migration new create_notifications
```
```sql
CREATE TABLE poker.notifications (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES poker.tenants(id),
  user_id INTEGER NOT NULL REFERENCES poker.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE poker.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications"
  ON poker.notifications FOR SELECT
  USING (user_id = (SELECT id FROM poker.users WHERE email = auth.jwt()->>'email'));
```

### Apply Migration
```powershell
supabase db push --project-ref jhodhxvvhohygijqcxbo
git add supabase/migrations/
git commit -m "feat: add notifications table"
```

---

## Security Checklist

When writing code, ensure:
- [ ] All queries filtered by `tenant_id` (or rely on RLS)
- [ ] Auth check on all protected routes/API
- [ ] No hardcoded secrets (use env vars)
- [ ] User input validation
- [ ] Error messages don't leak sensitive data
- [ ] Database changes via migrations (not manual SQL)

---

## Testing

```powershell
# Type checking
pnpm typecheck

# Run dev server
pnpm dev

# Build for production
pnpm build
```

---

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://jhodhxvvhohygijqcxbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Resources

- Full Project Documentation: `CLAUDE.md`
- Migration Guide: `db/MIGRATION_WORKFLOW.md`
- Backup Guide: `db/BACKUP_POSTGRESQL.md`
- Type Definitions: `lib/types.ts`

---

## Remember

1. **Migrations for DB changes** - Always!
2. **Filter by tenant_id** - Multi-tenant isolation
3. **Use Supabase Auth** - No custom auth
4. **TypeScript strict** - Type everything
5. **RLS policies** - Security at DB level
