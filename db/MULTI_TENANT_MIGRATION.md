# Multi-Tenant User Support - Migration Guide

## Overview

This migration adds support for users to participate in multiple home games (tenants). Users can now:
- Be members of multiple poker home games
- Switch between different home games
- Have different roles in different home games (admin in one, player in another)
- See a personalized dashboard with their statistics

## Database Changes

### New Tables

1. **`poker.user_tenants`** - Many-to-many relationship between users and tenants
   - `id` - Primary key
   - `user_id` - References poker.users
   - `tenant_id` - References poker.tenants
   - `role` - 'admin' or 'player' (role within this specific tenant)
   - `player_id` - Optional reference to poker.players
   - `is_active` - Boolean flag
   - `created_at`, `updated_at` - Timestamps

2. **`poker.session_confirmations`** - Track player confirmations for upcoming sessions
   - `id` - Primary key
   - `session_id` - References poker.sessions
   - `player_id` - References poker.players
   - `confirmed` - Boolean flag
   - `confirmed_at` - Timestamp when confirmed
   - `created_at`, `updated_at` - Timestamps

### Modified Tables

1. **`poker.users`**
   - Added `current_tenant_id` - References the currently selected tenant
   - Existing `tenant_id` kept for backward compatibility

2. **`poker.sessions`**
   - Added `scheduled_date` - For future/upcoming sessions
   - Added `max_players` - Maximum number of players for a session
   - Added `is_confirmed` - Whether the session is confirmed

### Helper Functions

1. **`poker.get_user_tenants(user_email TEXT)`**
   - Returns all tenants a user belongs to
   - Includes tenant name, role, player_id, is_active status

2. **`poker.switch_user_tenant(user_email TEXT, new_tenant_id INTEGER)`**
   - Switches user's active tenant
   - Validates user has access to the tenant
   - Updates `current_tenant_id` in users table

### RLS Policies

New policies ensure:
- Users can only see their own tenant memberships
- Admins can manage memberships for their tenants
- Players can manage their own session confirmations
- Admins can see all confirmations for their tenant's sessions

## Application Changes

### API Routes

**`/api/user-tenants`**
- `GET` - Returns all tenants the authenticated user belongs to
- `POST` - Switches the user's active tenant
  - Body: `{ tenant_id: number }`
  - Returns updated user data

### Pages

**`/select-tenant`** - New page for tenant selection
- Shows all tenants the user belongs to
- Allows switching between tenants
- Auto-redirects if user has only one tenant

### Components

**`TenantSwitcher`** - New component in sidebar
- Shows current home game name
- Opens dialog to switch between home games
- Only visible if user has multiple tenants

**`PlayerDashboard`** - Enhanced player dashboard
- Shows personal statistics (profit, win rate, ranking)
- Displays upcoming sessions
- Section for confirming participation in future games

### Auth Context Updates

- Now loads user's tenants list during authentication
- Stores tenants in user object
- Redirects to `/select-tenant` if user has multiple tenants after login

### TypeScript Types

Updated types in `lib/types.ts`:
- `User` interface now includes `current_tenant_id` and `tenants` array
- New `UserTenant` interface for tenant memberships
- New `SessionConfirmation` interface for session confirmations
- `Session` interface updated with upcoming session fields

## Migration Steps

### 1. Run the SQL Migration

Execute the migration file against your Supabase database:

```bash
# Using Supabase CLI (recommended)
supabase migration new add_user_tenants_multi_home_game
# Copy the content from db/migrations/add_user_tenants_multi_home_game.sql
supabase db push --project-ref jhodhxvvhohygijqcxbo

# OR using psql directly
psql -h aws-1-sa-east-1.pooler.supabase.com \
     -U postgres.jhodhxvvhohygijqcxbo \
     -d postgres \
     -f db/migrations/add_user_tenants_multi_home_game.sql
```

### 2. Data Migration

The migration automatically migrates existing user-tenant relationships to the new `user_tenants` table. However, verify:

```sql
-- Check if all users were migrated
SELECT COUNT(*) FROM poker.users;
SELECT COUNT(*) FROM poker.user_tenants;

-- Verify data integrity
SELECT u.email, ut.tenant_id, t.name as tenant_name, ut.role
FROM poker.users u
JOIN poker.user_tenants ut ON ut.user_id = u.id
JOIN poker.tenants t ON t.id = ut.tenant_id
ORDER BY u.email;
```

### 3. Test the Application

1. **Login Flow**
   - Login with a user that has multiple tenants → should see tenant selection page
   - Login with a user that has one tenant → should go directly to dashboard

2. **Tenant Switching**
   - Click on "Trocar Home Game" in sidebar
   - Select a different tenant
   - Verify dashboard updates with new tenant data

3. **Player Dashboard**
   - Login as a player (user with player_id)
   - Verify personalized dashboard shows:
     - Personal statistics
     - Win rate
     - Ranking
     - Recent sessions
     - Upcoming games section

## Backward Compatibility

The migration maintains backward compatibility:
- Existing `tenant_id` in users table is preserved
- All existing user-tenant relationships are migrated
- Applications not using the new multi-tenant features continue to work
- RLS policies work for both old and new code

## Rollback Plan

If issues arise, you can rollback:

```sql
-- Remove new tables
DROP TABLE IF EXISTS poker.session_confirmations CASCADE;
DROP TABLE IF EXISTS poker.user_tenants CASCADE;

-- Remove new functions
DROP FUNCTION IF EXISTS poker.get_user_tenants(TEXT);
DROP FUNCTION IF EXISTS poker.switch_user_tenant(TEXT, INTEGER);

-- Remove new columns from users
ALTER TABLE poker.users DROP COLUMN IF EXISTS current_tenant_id;

-- Remove new columns from sessions
ALTER TABLE poker.sessions 
  DROP COLUMN IF EXISTS scheduled_date,
  DROP COLUMN IF EXISTS max_players,
  DROP COLUMN IF EXISTS is_confirmed;
```

## Future Enhancements

Planned features for future releases:
- [ ] Invitation system for adding users to multiple tenants
- [ ] Tenant-specific player profiles
- [ ] Cross-tenant statistics and rankings
- [ ] Bulk tenant management for super admins
- [ ] Session confirmation notifications
- [ ] Waitlist for full sessions

## Support

For issues or questions:
1. Check the migration logs in Supabase dashboard
2. Review RLS policies if permission errors occur
3. Verify function execution with `SELECT poker.get_user_tenants('user@email.com');`
4. Check browser console for client-side errors

## Security Considerations

- All tenant data is isolated by RLS policies
- Users can only see data from tenants they belong to
- Admins can only manage users/data within their own tenants
- Super admins maintain global access (when needed)
- Session confirmations are protected per tenant
- Helper functions use SECURITY DEFINER but validate permissions

## Performance Notes

- Indexes added on all foreign keys
- Compound indexes for common queries
- Helper functions optimized for read performance
- Consider adding caching for user tenant lists if needed
