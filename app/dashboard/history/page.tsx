'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History as HistoryIcon } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Histórico de Sessões</h1>
        <p className="text-muted-foreground mt-2">
          Veja todas as partidas anteriores e seus resultados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessões Anteriores</CardTitle>
          <CardDescription>
            Histórico completo de todas as partidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sessão encontrada</p>
            <p className="text-sm mt-2">As sessões aparecerão aqui após serem criadas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

