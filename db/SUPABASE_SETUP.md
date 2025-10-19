# Supabase Setup Guide - Phase 1 Complete

This document explains the Supabase foundation setup completed in Phase 1 of the migration from Hostinger to Vercel.

## Files Created

### 1. Database Schema (`db/supabase-schema.sql`)

Complete PostgreSQL schema with all 8 tables converted from MySQL:

- **tenants** - Multi-tenant organizations (poker groups/clubs)
- **users** - System users with authentication and roles
- **players** - Poker players (may or may not have user accounts)
- **sessions** - Poker game sessions with buy-ins, cash-outs, and transfers
- **user_invites** - Email invitations to join a tenant
- **audit_logs** - Audit trail for all system changes
- **player_transfers** - Money transfers between players after sessions
- **user_sessions** - Active login sessions for users

#### Key Conversions from MySQL to PostgreSQL:

- `AUTO_INCREMENT` → `SERIAL`
- `ENUM` → `VARCHAR with CHECK constraints`
- `JSON` → `JSONB` (more efficient in PostgreSQL)
- `tinyint(1)` → `BOOLEAN`
- `CURRENT_TIMESTAMP` → `NOW()`
- `timestamp` → `TIMESTAMP WITH TIME ZONE`
- `utf8mb4_unicode_ci` → PostgreSQL default UTF-8

#### Row Level Security (RLS) Policies:

All tables have RLS enabled with multi-tenant isolation:

```sql
-- Example policy for sessions table
CREATE POLICY "tenant_isolation_sessions_select" ON sessions
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    tenant_id = NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::integer
  );
```

**Security guarantees:**
- Super admins can access ALL data across ALL tenants
- Regular users (admin/player) can only access data from their own tenant
- tenant_id is extracted from JWT token: `auth.jwt() -> 'app_metadata' ->> 'tenant_id'`
- Even with direct database access, users cannot query other tenants' data

### 2. Client-Side Supabase Client (`lib/supabaseClient.ts`)

Browser-safe Supabase client using the anon key:

```typescript
import { supabase } from '@/lib/supabaseClient';

// Check connection
const isConnected = await checkSupabaseConnection();

// Set auth after login (JWT token already contains tenant_id, user_id, role claims)
await setSupabaseAuth(token);

// Clear auth on logout
await clearSupabaseAuth();

// Get current session
const session = await getSupabaseSession();
```

**Features:**
- Persistent session storage
- Automatic token refresh
- Session detection in URL
- Connection check helper
- Auth management helpers

### 3. Server-Side Supabase Client (`lib/supabaseServer.ts`)

Server-only client with service role key (bypasses RLS):

```typescript
import { supabaseServer, executeWithServiceRole } from '@/lib/supabaseServer';

// Get tenant by ID
const tenant = await getTenantById(1);

// Get all tenants (super admin)
const tenants = await getAllTenants();

// User management
const user = await getUserByEmail('user@example.com');
const newUser = await createUser({ tenant_id: 1, name: 'John', ... });
const updated = await updateUser(userId, { is_active: true });

// Audit logging
await createAuditLog({
  tenant_id: 1,
  user_id: 1,
  action: 'login',
  ip_address: '192.168.1.1',
});

// Sessions and players
const sessions = await getSessionsByTenant(tenantId);
const players = await getPlayersByTenant(tenantId);

// Update player stats
await updatePlayerStats(playerId, { total_sessions: 10 });

// Cleanup utilities
await cleanExpiredInvites();
await cleanExpiredSessions();
```

**Use cases:**
- Server Actions in Next.js
- API Routes that need admin access
- Background jobs and cron tasks
- Data migration scripts
- Bypassing RLS when necessary

### 4. Data Migration Script (`scripts/migrate-data.ts`)

TypeScript script to migrate all data from MySQL to Supabase:

```bash
# Install dependencies first
npm install @supabase/supabase-js mysql2

# Run migration
npx ts-node scripts/migrate-data.ts
```

**Features:**
- Connects to existing MySQL database
- Migrates all 8 tables in correct order (respects foreign keys)
- Batch processing for large tables (audit_logs)
- Comprehensive error logging per record
- Automatic sequence reset after migration
- Migration summary with success/failure stats
- JSON parsing for JSONB columns

**Migration order:**
1. tenants (no dependencies)
2. users (depends on tenants)
3. players (depends on tenants, users)
4. sessions (depends on tenants, users)
5. user_invites (depends on tenants, users, players)
6. audit_logs (depends on tenants, users)
7. player_transfers (depends on sessions, players, tenants)
8. Reset sequences

## Environment Variables Required

Add to `.env.local` (already in MIGRATION_PLAN.md):

```env
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL="https://jhodhxvvhohygijqcxbo.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# PostgreSQL Direct Connection (optional)
POSTGRES_URL="postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
POSTGRES_PRISMA_URL="postgres://postgres.jhodhxvvhohygijqcxbo:affJLwPDtzPm0LYI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# MySQL (for migration only)
DB_HOST="localhost"
DB_NAME="poker_db"
DB_USER="root"
DB_PASSWORD="your_password"
```

## Installation Steps

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install --save-dev mysql2 @types/mysql2
```

### Step 2: Run Schema in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy contents of `db/supabase-schema.sql`
5. Paste and run the entire script
6. Verify all tables are created in Table Editor

### Step 3: Configure JWT Settings

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Note the JWT Secret (already in env vars)
3. Ensure JWT expiration is set appropriately (default 3600s)

### Step 4: Run Data Migration

```bash
# Ensure MySQL is accessible
# Ensure .env.local has both MySQL and Supabase credentials

npx ts-node scripts/migrate-data.ts
```

Watch the console for:
- Connection confirmations
- Per-table migration progress
- Error logs
- Final summary with success rates

### Step 5: Verify Migration

In Supabase Dashboard → Table Editor:
- Check each table has data
- Verify record counts match MySQL
- Spot-check JSON columns (players_data, recommendations, etc.)
- Test RLS by querying as different users

### Step 6: Test Supabase Clients

Create a test file `test-supabase.ts`:

```typescript
import { supabase } from './lib/supabaseClient';
import { getAllTenants } from './lib/supabaseServer';

// Test client
const testClient = async () => {
  const { data, error } = await supabase
    .from('tenants')
    .select('count');
  console.log('Client test:', { data, error });
};

// Test server
const testServer = async () => {
  const tenants = await getAllTenants();
  console.log('Server test:', tenants.length, 'tenants');
};

testClient();
testServer();
```

Run: `npx ts-node test-supabase.ts`

## Next Steps (Phase 2+)

Phase 1 is complete. The following phases will:

### Phase 2: Authentication Migration
- Replace JWT auth with Supabase Auth
- Migrate login/logout endpoints
- Update auth context to use Supabase session
- Update middleware to check Supabase tokens

### Phase 3: API Migration
- Replace PHP endpoints with Next.js API Routes or Server Actions
- Update all API calls in `lib/api.ts`
- Migrate session CRUD operations
- Migrate player management
- Migrate invite system
- Migrate super admin operations

### Phase 4: Frontend Updates
- Update all data fetching to use Supabase
- Replace API client with Supabase queries
- Implement real-time updates (optional)
- Update error handling for Supabase errors

### Phase 5: Deployment
- Remove `output: 'export'` from `next.config.ts`
- Enable SSR and image optimization
- Deploy to Vercel
- Configure environment variables in Vercel dashboard
- Run smoke tests in production

## Troubleshooting

### Migration Script Fails

**Issue:** Cannot connect to MySQL
**Solution:** Verify DB_HOST, DB_USER, DB_PASSWORD in .env.local

**Issue:** Supabase insert fails with "violates foreign key constraint"
**Solution:** Migration order matters. Tables are migrated in dependency order.

**Issue:** JSON parsing errors
**Solution:** Some MySQL JSON columns might be NULL or empty strings. Script handles this.

### RLS Policies Block Queries

**Issue:** Queries return empty even though data exists
**Solution:**
- Check JWT token includes tenant_id in app_metadata
- Use service role key (supabaseServer) to bypass RLS temporarily
- Verify policies with: `SELECT * FROM pg_policies WHERE tablename = 'sessions';`

### Sequence Reset Issues

**Issue:** Inserting new records fails with "duplicate key value"
**Solution:** Manually reset sequences in Supabase SQL Editor:

```sql
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
-- ... repeat for all tables
```

## Important Notes

1. **DO NOT commit .env.local** - It contains sensitive credentials
2. **Service role key** - Only use server-side, NEVER expose to browser
3. **RLS policies** - Test thoroughly to ensure proper tenant isolation
4. **Migration is one-time** - After successful migration, keep MySQL as backup for a while
5. **Sequences** - New records will use auto-incremented IDs starting after migrated data

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Project README: `CLAUDE.md`
- Migration Plan: `MIGRATION_PLAN.md`

---

**Phase 1 Status: ✅ COMPLETE**

All foundation files created:
- ✅ `db/supabase-schema.sql` (PostgreSQL schema with RLS)
- ✅ `lib/supabaseClient.ts` (client-side Supabase)
- ✅ `lib/supabaseServer.ts` (server-side Supabase)
- ✅ `scripts/migrate-data.ts` (data migration)

Ready to proceed with Phase 2: Authentication Migration.
