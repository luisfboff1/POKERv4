import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    // Get the session from the request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token with Supabase
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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
        tenants (
          name
        )
      `)
      .eq('email', supabaseUser.email)
      .eq('is_active', true)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/auth/user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
