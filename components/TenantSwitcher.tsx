'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Repeat, Loader2, ArrowRight } from 'lucide-react';
import type { UserTenant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface TenantSwitcherProps {
  currentTenantId?: number;
  currentTenantName?: string;
}

export function TenantSwitcher({ currentTenantId, currentTenantName }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);

  // Fetch tenants on mount
  useEffect(() => {
    fetchTenants();
  }, []);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && tenants.length === 0) {
      await fetchTenants();
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await api.userTenants.list();

      if (response.success && response.data) {
        setTenants(response.data as UserTenant[]);
      }
    } catch (error) {
      console.error('[TENANT_SWITCH_UI] Erro ao buscar tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantId: number) => {
    if (tenantId === currentTenantId) {
      setOpen(false);
      return;
    }

    try {
      setSwitching(tenantId);

      const response = await api.userTenants.switch(tenantId);

      if (response.success) {
        // Force a complete reload to clear all caches
        window.location.reload();
      } else {
        console.error('[TENANT_SWITCH_UI] Falha na troca:', response.error);
        alert(response.error || 'Erro ao trocar de home game');
      }
    } catch (error) {
      console.error('[TENANT_SWITCH_UI] Exceção durante troca:', error);
      alert('Erro ao trocar de home game');
    } finally {
      setSwitching(null);
    }
  };

  // Always show the button

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Repeat className="w-4 h-4" />
          <span className="font-medium flex-1 text-left truncate">
            {currentTenantName || 'Trocar Home Game'}
          </span>
          {tenants.length > 1 && (
            <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
              {tenants.length}
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar de Home Game</DialogTitle>
          <DialogDescription>
            Selecione qual home game você deseja acessar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum home game encontrado
            </div>
          ) : tenants.length === 1 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                Você tem acesso apenas a este home game
              </div>
              <button
                onClick={() => setOpen(false)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  'border-primary bg-primary/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {tenants[0].tenant_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tenants[0].role === 'admin' ? 'Administrador' : 'Jogador'}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded ml-2">
                    Atual
                  </div>
                </div>
              </button>
            </div>
          ) : (
            tenants.map((tenant) => {
              const isCurrent = tenant.tenant_id === currentTenantId;
              const isSwitching = switching === tenant.tenant_id;

              return (
                <button
                  key={tenant.tenant_id}
                  onClick={() => switchTenant(tenant.tenant_id)}
                  disabled={switching !== null}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    'hover:shadow-md hover:-translate-y-0.5',
                    isCurrent
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50',
                    switching !== null && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {tenant.tenant_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tenant.role === 'admin' ? 'Administrador' : 'Jogador'}
                      </div>
                    </div>
                    {isSwitching ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary ml-2" />
                    ) : isCurrent ? (
                      <div className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded ml-2">
                        Atual
                      </div>
                    ) : (
                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-2" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
