'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, History, Trophy, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Bem-vindo, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie suas sessões de poker e acompanhe os rankings
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/new">
              <CardHeader>
                <Plus className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Nova Sessão</CardTitle>
                <CardDescription>
                  Criar uma nova partida de poker
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        )}

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/history">
            <CardHeader>
              <History className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Histórico</CardTitle>
              <CardDescription>
                Ver todas as sessões anteriores
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/ranking">
            <CardHeader>
              <Trophy className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Ranking</CardTitle>
              <CardDescription>
                Ver classificação dos jogadores
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/invites">
              <CardHeader>
                <Users className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Convites</CardTitle>
                <CardDescription>
                  Convidar novos jogadores
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        )}
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
          <CardDescription>
            Últimas partidas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sessão encontrada</p>
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira sessão
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

