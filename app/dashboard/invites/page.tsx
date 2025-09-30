'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function InvitesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Convites</h1>
        <p className="text-muted-foreground mt-2">
          Convide novos jogadores para o seu time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Convites</CardTitle>
          <CardDescription>
            Envie convites para novos jogadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Sistema de convites em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

