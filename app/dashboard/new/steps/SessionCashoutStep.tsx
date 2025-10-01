import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Utensils } from 'lucide-react';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';

type EditableLivePlayerField = 'janta' | 'cashout' | 'session_paid' | 'janta_paid';

interface SessionCashoutStepProps {
  currentSession: LiveSession;
  totals: { totalBuyin: number; totalCashout: number; totalJanta: number };
  isBalanced: boolean;
  updatePlayerField: <K extends EditableLivePlayerField>(id: string, field: K, value: LivePlayer[K]) => void;
  setStep: (step: SessionStep) => void;
  calculateRecommendations: () => void;
}

export const SessionCashoutStep: React.FC<SessionCashoutStepProps> = ({
  currentSession,
  totals,
  isBalanced,
  updatePlayerField,
  setStep,
  calculateRecommendations
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Finalizar Sessão</h1>
      <p className="text-sm text-muted-foreground">Registre quanto cada jogador saiu em fichas</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Cash-out dos Jogadores</CardTitle>
        <CardDescription>Digite quanto cada jogador terminou em fichas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentSession.players.map((player: LivePlayer) => (
            <div key={player.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{player.name}</p>
                <p className="text-sm text-muted-foreground">
                  Buy-in total: {formatCurrency(player.totalBuyin)} • Janta: {formatCurrency(player.janta)}
                </p>
              </div>
              <div className="w-32">
                <Label>Cash-out</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={player.cashout || ''}
                  onChange={(e) => updatePlayerField(player.id, 'cashout', Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`session_paid_${player.id}`}
                    checked={player.session_paid || false}
                    onChange={(e) => updatePlayerField(player.id, 'session_paid', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`session_paid_${player.id}`} className="text-sm flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Sessão
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`janta_paid_${player.id}`}
                    checked={player.janta_paid || false}
                    onChange={(e) => updatePlayerField(player.id, 'janta_paid', e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor={`janta_paid_${player.id}`} className="text-sm flex items-center gap-1">
                    <Utensils className="h-3 w-3" /> Janta
                  </label>
                </div>
              </div>
              <div className="w-24 text-center">
                <Label>Resultado</Label>
                {(() => {
                  const result = player.cashout - player.totalBuyin;
                  const positive = result >= 0;
                  return (
                    <div className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
                      {positive ? '+' : ''}{formatCurrency(result)}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{formatCurrency(totals.totalBuyin)}</div>
                <div className="text-sm text-muted-foreground">Total Buy-in</div>
              </div>
              <div>
                <div className="text-xl font-bold">{formatCurrency(totals.totalCashout)}</div>
                <div className="text-sm text-muted-foreground">Total Cash-out</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {isBalanced ? '✓ Balanceado' : `⚠ Diferença: ${formatCurrency(Math.abs(totals.totalBuyin - totals.totalCashout))}`}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-6">
          <Button onClick={calculateRecommendations} disabled={totals.totalCashout === 0} variant="outline">
            Calcular Transferências
          </Button>
          <Button onClick={() => setStep('transfers')} disabled={!isBalanced}>Continuar</Button>
          <Button variant="ghost" onClick={() => setStep('active')}>Voltar</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);