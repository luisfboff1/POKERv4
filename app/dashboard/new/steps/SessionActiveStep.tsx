import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { UpdateLivePlayerField } from './types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';
import { RebuyModal } from '../modals/RebuyModal';
import { useConfirmModal } from '@/components/ui/modal';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface SessionActiveStepProps {
  currentSession: LiveSession;
  totals: { totalBuyin: number; totalJanta: number; playersCount: number };
  addPlayerModal: { open: () => void };
  setStep: (step: SessionStep) => void;
  updatePlayerField: UpdateLivePlayerField;
  addRebuy: (id: string, amount: number) => void;
  removeRebuy?: (id: string, index: number) => void;
  editRebuy?: (id: string, index: number, amount: number) => void;
}

// Component for janta input to avoid hook issues in cell renderer
const JantaInput: React.FC<{
  player: LivePlayer;
  updatePlayerField: UpdateLivePlayerField;
}> = ({ player, updatePlayerField }) => {
  const [localValue, setLocalValue] = useState(player.janta?.toString() || '');
  
  useEffect(() => {
    setLocalValue(player.janta?.toString() || '');
  }, [player.janta]);

  return (
    <Input
      type="number"
      value={localValue}
      placeholder="0"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const value = Number(localValue) || 0;
        updatePlayerField(player.id, 'janta', value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const value = Number(localValue) || 0;
          updatePlayerField(player.id, 'janta', value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="h-8 w-24"
    />
  );
};

export const SessionActiveStep: React.FC<SessionActiveStepProps> = ({
  currentSession,
  totals,
  addPlayerModal,
  setStep,
  updatePlayerField,
  addRebuy,
  removeRebuy,
  editRebuy
}) => {
  const [rebuyModal, setRebuyModal] = useState<{ isOpen: boolean; playerId: string; playerName: string; index?: number }>(
    {
      isOpen: false,
      playerId: '',
      playerName: ''
    }
  );
  const [initialRebuyAmount, setInitialRebuyAmount] = useState<number | undefined>(undefined);
  const { confirm, ConfirmModalComponent } = useConfirmModal();

  const openRebuyModal = (playerId: string, playerName: string, index?: number) => {
    // if editing, try to get current amount
    const initialAmount = typeof index === 'number' && index >= 0
      ? (currentSession.players.find(p => p.id === playerId)?.rebuys[index] ?? undefined)
      : undefined;
    setInitialRebuyAmount(initialAmount);
    setRebuyModal({ isOpen: true, playerId, playerName, index });
  };

  const closeRebuyModal = () => {
    setRebuyModal({ isOpen: false, playerId: '', playerName: '' });
    setInitialRebuyAmount(undefined);
  };

  const handleRebuyConfirm = (amount: number) => {
    if (rebuyModal.index !== undefined && typeof editRebuy === 'function') {
      editRebuy(rebuyModal.playerId, rebuyModal.index, amount);
    } else {
      addRebuy(rebuyModal.playerId, amount);
    }
  };

  // Calcular o buy-in padrão da sessão (média dos buy-ins iniciais)
  const defaultBuyin = currentSession.players.length > 0
    ? Math.round(currentSession.players.reduce((sum, p) => sum + p.buyin, 0) / currentSession.players.length)
    : 50;

  // Define columns for active session table
  const columns: ColumnDef<LivePlayer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jogador" />
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "buyin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Buy-in" />
      ),
      cell: ({ row }) => formatCurrency(row.getValue("buyin")),
    },
    {
      accessorKey: "rebuys",
      header: "Rebuys",
      cell: ({ row }) => {
        const player = row.original;
        const rebuyTotal = player.rebuys.reduce((s, r) => s + r, 0);
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground">
                {player.rebuys.length} ({formatCurrency(rebuyTotal)})
              </div>
              <div className="flex flex-wrap gap-1">
                {player.rebuys.map((r, i) => (
                  <div key={i} className="bg-muted px-2 py-1 rounded flex items-center gap-1">
                    <span className="text-xs">{formatCurrency(r)}</span>
                    {typeof editRebuy === 'function' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openRebuyModal(player.id, player.name, i);
                        }}
                        className="h-auto p-0.5"
                        title="Editar rebuy"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {typeof removeRebuy === 'function' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={(e) => {
                          e.stopPropagation();
                          confirm({
                            title: 'Remover Rebuy',
                            message: `Remover rebuy de ${player.name} ${formatCurrency(r)}?`,
                            onConfirm: () => removeRebuy(player.id, i),
                            confirmText: 'Remover',
                            cancelText: 'Cancelar',
                            variant: 'destructive'
                          });
                        }}
                        className="h-auto p-0.5"
                        title="Remover rebuy"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                addRebuy(player.id, defaultBuyin);
              }}
              title="Adicionar rebuy"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "janta",
      header: "Janta",
      cell: ({ row }) => {
        const player = row.original;
        return <JantaInput player={player} updatePlayerField={updatePlayerField} />;
      },
    },
    {
      accessorKey: "totalBuyin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => formatCurrency(row.getValue("totalBuyin")),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={(e) => {
            e.stopPropagation();
            openRebuyModal(row.original.id, row.original.name);
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Rebuy
        </Button>
      ),
    },
  ];

  // Mobile Player Card Component
  const MobilePlayerCard: React.FC<{ player: LivePlayer }> = ({ player }) => {
    const [localJanta, setLocalJanta] = useState(player.janta?.toString() || '');
    
    useEffect(() => {
      setLocalJanta(player.janta?.toString() || '');
    }, [player.janta]);

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header: Name and Total */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{player.name}</h3>
              <p className="text-sm text-muted-foreground">
                Buy-in: {formatCurrency(player.buyin)}
              </p>
            </div>
            <div className="text-right ml-2">
              <div className="text-lg font-bold">{formatCurrency(player.totalBuyin)}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Rebuys Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Rebuys</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  openRebuyModal(player.id, player.name);
                }}
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            {player.rebuys.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {player.rebuys.map((r, i) => (
                  <div key={i} className="bg-muted px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(r)}</span>
                    <div className="flex gap-1">
                      {typeof editRebuy === 'function' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openRebuyModal(player.id, player.name, i);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {typeof removeRebuy === 'function' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            confirm({
                              title: 'Remover Rebuy',
                              message: `Remover rebuy de ${player.name} ${formatCurrency(r)}?`,
                              onConfirm: () => removeRebuy(player.id, i),
                              confirmText: 'Remover',
                              cancelText: 'Cancelar',
                              variant: 'destructive'
                            });
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum rebuy</p>
            )}
          </div>

          {/* Janta Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Janta (R$)</label>
            <Input
              type="number"
              value={localJanta}
              placeholder="0"
              onChange={(e) => setLocalJanta(e.target.value)}
              onBlur={() => {
                const value = Number(localJanta) || 0;
                updatePlayerField(player.id, 'janta', value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = Number(localJanta) || 0;
                  updatePlayerField(player.id, 'janta', value);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="h-11 text-base"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
  <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2 md:gap-3">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="truncate">{currentSession.location}</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {new Date(currentSession.date).toLocaleDateString('pt-BR')} • Sessão em andamento
            </p>
          </div>
          <Button 
            onClick={() => setStep('cashout')} 
            variant="outline"
            className="w-full sm:w-auto"
            size="default"
          >
            Finalizar Sessão
          </Button>
        </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="text-xl md:text-2xl font-bold">{totals.playersCount}</div>
          <p className="text-xs text-muted-foreground">Jogadores</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalBuyin)}</div>
          <p className="text-xs text-muted-foreground">Total Buy-in</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="text-xl md:text-2xl font-bold">{formatCurrency(totals.totalJanta)}</div>
          <p className="text-xs text-muted-foreground">Janta</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <Button size="sm" className="w-full h-9 md:h-10" onClick={() => addPlayerModal.open()}>
            <Plus className="h-4 w-4 mr-1" /> Jogador
          </Button>
        </CardContent>
      </Card>
    </div>

    {/* Mobile View - Card List */}
    <div className="md:hidden space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">Controle de Mesa</h2>
        <span className="text-sm text-muted-foreground">{currentSession.players.length} jogadores</span>
      </div>
      {currentSession.players.map((player) => (
        <MobilePlayerCard key={player.id} player={player} />
      ))}
    </div>

    {/* Desktop View - DataTable */}
    <Card className="hidden md:block">
      <CardHeader>
        <CardTitle>Controle de Mesa</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={currentSession.players}
          searchKey="name"
          searchPlaceholder="Filtrar por jogador..."
          enableColumnVisibility={true}
          enableSorting={true}
          enableFiltering={true}
        />
      </CardContent>
    </Card>
      </div>

      <RebuyModal
        isOpen={rebuyModal.isOpen}
        onClose={closeRebuyModal}
        playerName={rebuyModal.playerName}
        onConfirm={handleRebuyConfirm}
        defaultBuyin={defaultBuyin}
        initialAmount={initialRebuyAmount}
      />
      {ConfirmModalComponent}
    </>
  );
};