'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function InvitesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Convites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Convide novos jogadores, acompanhe o status e controle permissoes
        </p>
      </div>

      <Card className="bg-surface text-surface-foreground">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">Gerenciar convites</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Acompanhe convites pendentes, aprovados e expirados em um único lugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-page py-12 text-center text-sm text-muted-foreground">
            <Users className="h-10 w-10 text-primary/60" />
            <div>
              <p className="text-base font-medium text-foreground">Sistema de convites em desenvolvimento</p>
              <p className="mt-1 text-muted-foreground">
                Enviaremos notificações aos convidados e à equipe assim que estiver disponível.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

