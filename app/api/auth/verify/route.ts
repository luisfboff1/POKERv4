import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          tenant_name: user.tenant_name,
          tenant_plan: user.tenant_plan,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token inválido';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 401 }
    );
  }
}
