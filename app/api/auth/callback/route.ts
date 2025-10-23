import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseServer, createAuditLog } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url));
      }

      if (data.session && data.user) {
        // Check if user exists in our database
        const { data: existingUser, error: userError } = await supabaseServer
          .from('users')
          .select('id, tenant_id, is_active')
          .eq('email', data.user.email)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user:', userError);
          return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('Error verifying user')}`, req.url));
        }

        // If user doesn't exist, we need to create them or require an invite
        if (!existingUser) {
          // Check for pending invite
          const { data: invite, error: inviteError } = await supabaseServer
            .from('user_invites')
            .select('*')
            .eq('email', data.user.email)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single();

          if (inviteError || !invite) {
            // No invite found, redirect to error page
            await supabase.auth.signOut();
            return NextResponse.redirect(
              new URL(`/login?error=${encodeURIComponent('No invitation found for this email. Please contact your administrator.')}`, req.url)
            );
          }

          // Create user from invite
          const { data: newUser, error: createError } = await supabaseServer
            .from('users')
            .insert([{
              tenant_id: invite.tenant_id,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email!,
              password_hash: '', // OAuth users don't need password
              role: invite.role,
              is_active: true,
              player_id: invite.player_id,
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            await supabase.auth.signOut();
            return NextResponse.redirect(
              new URL(`/login?error=${encodeURIComponent('Error creating user account')}`, req.url)
            );
          }

          // Mark invite as accepted
          await supabaseServer
            .from('user_invites')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', invite.id);

          // Create audit log
          await createAuditLog({
            tenant_id: invite.tenant_id,
            user_id: newUser.id,
            action: 'oauth_signup',
            new_data: { 
              email: data.user.email,
              provider: data.user.app_metadata?.provider || 'unknown',
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            user_agent: req.headers.get('user-agent') || undefined,
          });
        } else {
          // User exists, check if active
          if (!existingUser.is_active) {
            await supabase.auth.signOut();
            return NextResponse.redirect(
              new URL(`/login?error=${encodeURIComponent('Your account is inactive')}`, req.url)
            );
          }

          // Update last login
          await supabaseServer
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', existingUser.id);

          // Create audit log
          await createAuditLog({
            tenant_id: existingUser.tenant_id,
            user_id: existingUser.id,
            action: 'oauth_login',
            new_data: { 
              email: data.user.email,
              provider: data.user.app_metadata?.provider || 'unknown',
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            user_agent: req.headers.get('user-agent') || undefined,
          });
        }

        // Redirect to dashboard
        return NextResponse.redirect(new URL(next, req.url));
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, req.url)
      );
    }
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/login', req.url));
}
