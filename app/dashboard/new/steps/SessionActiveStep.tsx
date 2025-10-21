import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { UpdateLivePlayerField } from './types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';
import { RebuyModal } from '../modals/RebuyModal';

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

  return (
    <>
  <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              {currentSession.location}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date(currentSession.date).toLocaleDateString('pt-BR')} • Sessão em andamento
            </p>
          </div>
          <Button onClick={() => setStep('cashout')} variant="outline">
            Finalizar Sessão
          </Button>
        </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totals.playersCount}</div>
          <p className="text-xs text-muted-foreground">Jogadores</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{formatCurrency(totals.totalBuyin)}</div>
          <p className="text-xs text-muted-foreground">Total Buy-in</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{formatCurrency(totals.totalJanta)}</div>
          <p className="text-xs text-muted-foreground">Janta</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Button size="sm" className="w-full" onClick={() => addPlayerModal.open()}>
            <Plus className="h-4 w-4 mr-1" /> Jogador
          </Button>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Controle de Mesa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2">Jogador</th>
                <th className="px-4 py-2">Buy-in</th>
                <th className="px-4 py-2">Rebuys</th>
                <th className="px-4 py-2">Janta</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentSession.players.map((player: LivePlayer) => {
                const rebuyTotal = player.rebuys.reduce((s, r) => s + r, 0);
                return (
                  <tr key={player.id} className="border-t">
                    <td className="px-4 py-3">{player.name}</td>
                    <td className="px-4 py-3">{formatCurrency(player.buyin)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="text-xs text-muted-foreground">{player.rebuys.length} ({formatCurrency(rebuyTotal)})</div>
                          <div className="flex gap-2">
                            {player.rebuys.map((r, i) => (
                              <div key={i} className="bg-muted px-2 py-1 rounded flex items-center gap-2">
                                <span className="text-xs">{formatCurrency(r)}</span>
                                {typeof editRebuy === 'function' && (
                                  <Button size="sm" variant="ghost" onClick={() => openRebuyModal(player.id, player.name, i)} title="Editar rebuy">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                {typeof removeRebuy === 'function' && (
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    // confirm before removing
                                    // eslint-disable-next-line no-restricted-globals
                                    if (confirm(`Remover rebuy de ${player.name} R$ ${r.toLocaleString('pt-BR')} ?`)) {
                                      removeRebuy(player.id, i);
                                    }
                                  }} title="Remover rebuy">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => addRebuy(player.id, defaultBuyin)} title="Adicionar rebuy">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={player.janta || ''}
                        placeholder="0"
                        onChange={(e) => updatePlayerField(player.id, 'janta', Number(e.target.value) || 0)}
                        className="h-8 w-32"
                      />
                    </td>
                    <td className="px-4 py-3">{formatCurrency(player.totalBuyin)}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openRebuyModal(player.id, player.name)}>
                        <Plus className="h-3 w-3 mr-1" /> Rebuy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </>
  );
};