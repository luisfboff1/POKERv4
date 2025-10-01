'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function NewSessionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Criar nova sessão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure mesas, valores e participantes para iniciar uma nova rodada
        </p>
      </div>

      <Card className="bg-surface text-surface-foreground">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">Dados da sessão</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Em breve será possível configurar todos os parâmetros antes de iniciar a partida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-page py-12 text-center text-sm text-muted-foreground">
            <Plus className="h-10 w-10 text-primary/60" />
            <div>
              <p className="text-base font-medium text-foreground">Ferramenta de criação em desenvolvimento</p>
              <p className="mt-1 text-muted-foreground">
                Configure blinds, buy-ins, cash-outs e PokerBot assim que esta etapa estiver concluída.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

