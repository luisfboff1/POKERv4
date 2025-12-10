import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { Save, Utensils, Minus, Plus } from 'lucide-react';
import type { LiveSession, TransferRecommendation } from '@/lib/types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

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
  recompute: () => void; // Recalcular otimização
  needsRecalc: boolean;  // Indica se há mudanças pendentes
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
  removeManualSuggestion,
  recompute,
  needsRecalc
}) => (
  <div className="space-y-4 md:space-y-6">
    <div className="space-y-1">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Transferências</h1>
      <p className="text-xs md:text-sm text-muted-foreground">Revise e ajuste as transferências necessárias</p>
    </div>

    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base md:text-lg">Otimizar Transferências</CardTitle>
            <CardDescription className="text-xs md:text-sm">Configure pagamentos manuais ou use a otimização automática</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => suggestionModal.open()} size="sm" variant="outline" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Sugerir
            </Button>
            <Button size="sm" variant={needsRecalc ? 'default' : 'outline'} disabled={!needsRecalc} onClick={recompute} className="w-full sm:w-auto">
              {needsRecalc ? 'Atualizar' : 'Atual'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {manualSuggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-3">Sugestões Manuais:</h4>
            <div className="space-y-2">
              {manualSuggestions.map((suggestion, index) => (
                <div key={index} className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg",
                  "bg-blue-50 border border-blue-200"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">M</div>
                    <div className="text-sm min-w-0">
                      <span className="font-medium truncate">{suggestion.from}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium truncate">{suggestion.to}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-sm font-bold text-blue-700">{formatCurrency(suggestion.amount)}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeManualSuggestion(index)} className="h-8 w-8 p-0">
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
          <CardTitle className="text-base md:text-lg">Transferências Finais</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {manualSuggestions.length > 0 ? 'Otimização considerando suas sugestões manuais' : 'Transfers otimizadas para zerar todos os saldos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {recommendations.map((rec, index) => {
              const isManual = manualSuggestions.some(s => s.from === rec.from && s.to === rec.to && s.amount === rec.amount);
              return (
                <div key={index} className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 rounded-lg",
                  isManual ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30'
                )}>
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={cn(
                      "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium flex-shrink-0",
                      isManual ? 'bg-blue-500 text-white' : 'bg-red-100 text-red-700'
                    )}>
                      {isManual ? 'M' : rec.from[0]}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className={cn(
                      "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium flex-shrink-0",
                      isManual ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-700'
                    )}>
                      {isManual ? 'M' : rec.to[0]}
                    </div>
                    <div className="text-xs md:text-sm min-w-0">
                      <span className="font-medium">{rec.from}</span> paga <span className="font-medium">{rec.to}</span>
                      {isManual && <span className="ml-2 text-[10px] md:text-xs text-blue-600">(manual)</span>}
                    </div>
                  </div>
                  <div className={cn(
                    "text-base md:text-lg font-bold text-right",
                    isManual ? 'text-blue-700' : 'text-primary'
                  )}>
                    {formatCurrency(rec.amount)}
                  </div>
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
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Utensils className="h-4 w-4 md:h-5 md:w-5" /> Janta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentSession.players.filter(p => p.janta > 0).map(player => (
              <div key={player.id} className="flex justify-between text-xs md:text-sm">
                <span>{player.name}</span>
                <span className="font-medium">{formatCurrency(player.janta)}</span>
              </div>
            ))}
            <div className="pt-2 border-t font-medium text-sm md:text-base">Total da janta: {formatCurrency(totals.totalJanta)}</div>
          </div>
        </CardContent>
      </Card>
    )}

    <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
      <Button onClick={finishSession} disabled={loading} className="w-full h-11 md:h-10 md:flex-1">
        {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
        Finalizar e Salvar Sessão
      </Button>
      <Button variant="outline" onClick={() => setStep('cashout')} className="w-full h-11 md:h-10 md:w-auto">Voltar</Button>
    </div>
  </div>
);