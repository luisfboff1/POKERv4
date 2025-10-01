'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function RankingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Ranking de jogadores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja a evolução do desempenho de cada membro do clube ao longo das sessões
        </p>
      </div>

      <Card className="bg-surface text-surface-foreground">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">Tabela de classificação</CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Rankings calculados automaticamente com base em lucros, consistência e participação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-page py-12 text-center text-sm text-muted-foreground">
            <Trophy className="h-10 w-10 text-primary/60" />
            <div>
              <p className="text-base font-medium text-foreground">Nenhum ranking disponível</p>
              <p className="mt-1 text-muted-foreground">
                Assim que novas sessões forem inseridas os rankings serão atualizados automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

