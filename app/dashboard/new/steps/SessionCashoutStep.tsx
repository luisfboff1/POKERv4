import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { UpdateLivePlayerField } from './types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';

interface SessionCashoutStepProps {
  currentSession: LiveSession;
  totals: { totalBuyin: number; totalCashout: number; totalJanta: number };
  isBalanced: boolean;
  updatePlayerField: UpdateLivePlayerField;
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
            <div key={player.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 p-4 border rounded-lg items-center">
              <div>
                <p className="font-medium">{player.name}</p>
                <p className="text-sm text-muted-foreground">
                  Buy-in total: {formatCurrency(player.totalBuyin)} • Janta: {formatCurrency(player.janta)}
                </p>
              </div>
              <div className="w-full md:w-32">
                <Label>Cash-out (R$)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={player.cashout || ''}
                  onChange={(e) => updatePlayerField(player.id, 'cashout', Number(e.target.value) || 0)}
                />
              </div>
              <div className="w-full md:w-32 text-center md:text-right">
                <Label>Resultado</Label>
                {(() => {
                  const result = player.cashout - player.totalBuyin;
                  const positive = result >= 0;
                  return (
                    <div className={`text-lg font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
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
                <div className={`text-xl font-bold flex items-center justify-center gap-2 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {isBalanced ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Balanceado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      Diferença: {formatCurrency(Math.abs(totals.totalBuyin - totals.totalCashout))}
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-6">
          <Button
            onClick={() => {
              calculateRecommendations();
              setStep('transfers');
            }}
            disabled={!isBalanced}
          >
            Continuar para Transferências
          </Button>
          <Button variant="ghost" onClick={() => setStep('active')}>Voltar</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);