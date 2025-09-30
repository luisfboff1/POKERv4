'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function NewSessionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Nova Sessão</h1>
        <p className="text-muted-foreground mt-2">
          Criar uma nova partida de poker
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Sessão</CardTitle>
          <CardDescription>
            Formulário para criar nova partida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Formulário em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

