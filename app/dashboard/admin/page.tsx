'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie usuários, permissões e configurações globais do Poker Manager
        </p>
      </div>

      <Card className="bg-surface text-surface-foreground">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">Super Admin</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Acesso completo ao sistema do clube para ajustes avançados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-page py-12 text-center text-sm text-muted-foreground">
            <Shield className="h-10 w-10 text-primary/60" />
            <div>
              <p className="text-base font-medium text-foreground">Painel administrativo em desenvolvimento</p>
              <p className="mt-1 text-muted-foreground">
                Configure permissões, times e integrações avançadas quando esta área estiver disponível.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

