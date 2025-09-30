'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Painel de Administração</h1>
        <p className="text-muted-foreground mt-2">
          Gerenciamento completo do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Super Admin</CardTitle>
          <CardDescription>
            Acesso total ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Painel administrativo em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

