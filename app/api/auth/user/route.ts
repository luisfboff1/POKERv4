import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    // Get the session from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[/api/auth/user] No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      console.log('[/api/auth/user] Invalid token:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[/api/auth/user] Fetching user for email:', supabaseUser.email);

    // Fetch user data from database using service role to bypass RLS
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        tenant_id,
        player_id,
        is_active,
        current_tenant_id,
        tenants!users_tenant_id_fkey (
          name
        )
      `)
      .eq('email', supabaseUser.email)
      .eq('is_active', true)
      .single();

    if (userError) {
      console.error('[/api/auth/user] Database error:', userError);
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'User not found in database',
          message: 'Sua conta do Supabase Auth existe, mas não há registro correspondente no banco de dados.',
          action: 'Por favor, execute a migração SQL ou registre-se novamente através do formulário de registro.',
          email: supabaseUser.email,
          errorCode: 'USER_NOT_IN_DB'
        }, { status: 404 });
      }
      // Check if it's a column error (migration not applied)
      if (userError.message && userError.message.includes('current_tenant_id')) {
        return NextResponse.json({ 
          error: 'Database migration required',
          message: 'O campo current_tenant_id não existe. Execute a migração add_user_tenants_multi_home_game.sql',
          action: 'Execute: supabase db push --project-ref jhodhxvvhohygijqcxbo',
          errorCode: 'MIGRATION_REQUIRED'
        }, { status: 500 });
      }
      return NextResponse.json({ 
        error: 'Failed to fetch user data',
        details: userError.message,
        hint: userError.hint || 'Verifique se a migração foi aplicada e se o usuário existe no banco de dados'
      }, { status: 500 });
    }

    if (!userData) {
      console.log('[/api/auth/user] No user data returned for:', supabaseUser.email);
      return NextResponse.json({ 
        error: 'User not found',
        email: supabaseUser.email 
      }, { status: 404 });
    }

    console.log('[/api/auth/user] User found:', userData.email);
    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error('[/api/auth/user] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
