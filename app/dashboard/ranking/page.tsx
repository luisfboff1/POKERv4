'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function RankingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Ranking de Jogadores</h1>
        <p className="text-muted-foreground mt-2">
          Classificação baseada no desempenho geral
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabela de Classificação</CardTitle>
          <CardDescription>
            Rankings calculados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum ranking disponível</p>
            <p className="text-sm mt-2">O ranking será calculado após as primeiras sessões</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

