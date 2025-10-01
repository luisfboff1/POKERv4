'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History as HistoryIcon } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Histórico de sessões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe tudo o que aconteceu nas mesas do seu clube em ordem cronológica
        </p>
      </div>

      <Card className="bg-surface text-surface-foreground">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">Sessões anteriores</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Consolide resultados, exporte relatórios e revise a evolução das mesas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-page py-12 text-center text-sm text-muted-foreground">
            <HistoryIcon className="h-10 w-10 text-primary/60" />
            <div>
              <p className="text-base font-medium text-foreground">Nenhuma sessão encontrada</p>
              <p className="mt-1 text-muted-foreground">
                Assim que forem criadas sessões elas aparecerão aqui com detalhes completos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

