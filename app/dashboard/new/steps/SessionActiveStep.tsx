import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';

interface SessionActiveStepProps {
  currentSession: LiveSession;
  totals: { totalBuyin: number; totalJanta: number; playersCount: number };
  addPlayerModal: { open: () => void };
  setStep: (step: SessionStep) => void;
  updatePlayerField: (id: string, field: keyof LivePlayer, value: any) => void;
  addRebuy: (id: string, amount: number) => void;
}

export const SessionActiveStep: React.FC<SessionActiveStepProps> = ({
  currentSession,
  totals,
  addPlayerModal,
  setStep,
  updatePlayerField,
  addRebuy
}) => (
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
        <div className="space-y-4">
          {currentSession.players.map((player: LivePlayer) => {
            const rebuyTotal = player.rebuys.reduce((s, r) => s + r, 0);
            return (
              <div key={player.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{player.name}</h4>
                  <div className="text-sm text-muted-foreground">Total: {formatCurrency(player.totalBuyin)}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <Label>Buy-in inicial</Label>
                    <div className="font-medium">{formatCurrency(player.buyin)}</div>
                  </div>
                  <div>
                    <Label>Rebuys ({player.rebuys.length})</Label>
                    <div className="font-medium">{formatCurrency(rebuyTotal)}</div>
                  </div>
                  <div>
                    <Label>Janta</Label>
                    <Input
                      type="number"
                      value={player.janta || ''}
                      placeholder="0"
                      onChange={(e) => updatePlayerField(player.id, 'janta', Number(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const amount = prompt('Valor do rebuy:');
                      if (amount) {
                        const n = Number(amount);
                        if (!isNaN(n) && n > 0) addRebuy(player.id, n);
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Rebuy
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  </div>
);