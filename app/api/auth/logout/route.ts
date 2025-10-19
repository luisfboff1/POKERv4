import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, invalidateSession, getTokenFromHeaders } from '@/lib/auth-helpers';
import { createAuditLog } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const token = getTokenFromHeaders(req);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const invalidated = await invalidateSession(token);

    await createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'logout',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Logout realizado com sucesso',
        invalidated,
      },
    });
  } catch (error) {
    console.error('Error in logout endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
