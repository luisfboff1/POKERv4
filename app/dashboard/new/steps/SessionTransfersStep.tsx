import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { Save, Utensils, Minus, Plus } from 'lucide-react';
import type { LiveSession, TransferRecommendation } from '@/lib/types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';

interface SessionTransfersStepProps {
  currentSession: LiveSession;
  totals: { totalJanta: number };
  recommendations: TransferRecommendation[];
  manualSuggestions: TransferRecommendation[];
  loading: boolean;
  finishSession: () => void;
  setStep: (step: SessionStep) => void;
  suggestionModal: { open: () => void };
  removeManualSuggestion: (index: number) => void;
}

export const SessionTransfersStep: React.FC<SessionTransfersStepProps> = ({
  currentSession,
  totals,
  recommendations,
  manualSuggestions,
  loading,
  finishSession,
  setStep,
  suggestionModal,
  removeManualSuggestion
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Transferências</h1>
      <p className="text-sm text-muted-foreground">Revise e ajuste as transferências necessárias</p>
    </div>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Otimizar Transferências</CardTitle>
            <CardDescription>Configure pagamentos manuais ou use a otimização automática</CardDescription>
          </div>
          <Button onClick={() => suggestionModal.open()} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Sugerir Pagamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {manualSuggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-3">Sugestões Manuais:</h4>
            <div className="space-y-2">
              {manualSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">M</div>
                    <div className="text-sm"><span className="font-medium">{suggestion.from}</span> → <span className="font-medium">{suggestion.to}</span></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-blue-700">{formatCurrency(suggestion.amount)}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeManualSuggestion(index)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {recommendations.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Transferências Finais</CardTitle>
          <CardDescription>
            {manualSuggestions.length > 0 ? 'Otimização considerando suas sugestões manuais' : 'Transfers otimizadas para zerar todos os saldos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const isManual = manualSuggestions.some(s => s.from === rec.from && s.to === rec.to && s.amount === rec.amount);
              return (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${isManual ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isManual ? 'bg-blue-500 text-white' : 'bg-red-100 text-red-700'}`}>
                      {isManual ? 'M' : rec.from[0]}
                    </div>
                    <span>→</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isManual ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-700'}`}>
                      {isManual ? 'M' : rec.to[0]}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{rec.from}</span> paga <span className="font-medium">{rec.to}</span>
                      {isManual && <span className="ml-2 text-xs text-blue-600">(manual)</span>}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isManual ? 'text-blue-700' : 'text-primary'}`}>{formatCurrency(rec.amount)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    )}

    {totals.totalJanta > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" /> Janta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentSession.players.filter(p => p.janta > 0).map(player => (
              <div key={player.id} className="flex justify-between text-sm">
                <span>{player.name}</span>
                <span>{formatCurrency(player.janta)}</span>
              </div>
            ))}
            <div className="pt-2 border-t font-medium">Total da janta: {formatCurrency(totals.totalJanta)}</div>
          </div>
        </CardContent>
      </Card>
    )}

    <div className="flex gap-3">
      <Button onClick={finishSession} disabled={loading} className="flex-1">
        {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
        Finalizar e Salvar Sessão
      </Button>
      <Button variant="outline" onClick={() => setStep('cashout')}>Voltar</Button>
    </div>
  </div>
);