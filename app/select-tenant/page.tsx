'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spade, ArrowRight, Loader2 } from 'lucide-react';
import type { UserTenant } from '@/lib/types';

export default function SelectTenantPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchUserTenants = async () => {
    try {
      const response = await fetch('/api/user-tenants');
      const data = await response.json();

      if (data.success) {
        setTenants(data.data);
        
        // If user has only one tenant, redirect automatically
        if (data.data.length === 1) {
          await selectTenant(data.data[0].tenant_id);
        }
      } else {
        console.error('Error fetching tenants:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (tenantId: number) => {
    try {
      setSwitching(tenantId);
      
      const response = await fetch('/api/user-tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      });

      const data = await response.json();

      if (data.success) {
        // Force a page reload to update auth context
        window.location.href = '/dashboard';
      } else {
        console.error('Error switching tenant:', data.error);
        alert(data.error || 'Erro ao selecionar home game');
      }
    } catch (error) {
      console.error('Error selecting tenant:', error);
      alert('Erro ao selecionar home game');
    } finally {
      setSwitching(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full border-2 border-border border-t-primary bg-white/30 backdrop-blur-md shadow-lg h-12 w-12" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg ring-4 ring-primary/20">
              <Spade className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Selecione um Home Game
          </h1>
          <p className="text-muted-foreground">
            Escolha qual home game você deseja acessar
          </p>
        </div>

        {/* Tenants Grid */}
        {tenants.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Você ainda não faz parte de nenhum home game.
              </p>
              <p className="text-muted-foreground mt-2">
                Entre em contato com um administrador para receber um convite.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((tenant) => (
              <Card
                key={tenant.tenant_id}
                className="transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
                onClick={() => !switching && selectTenant(tenant.tenant_id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{tenant.tenant_name}</span>
                    {switching === tenant.tenant_id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {tenant.role === 'admin' ? 'Administrador' : 'Jogador'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={switching !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTenant(tenant.tenant_id);
                    }}
                  >
                    {switching === tenant.tenant_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Acessando...
                      </>
                    ) : (
                      'Acessar Home Game'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
