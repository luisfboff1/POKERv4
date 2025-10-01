import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { Play } from 'lucide-react';
import type { LiveSession } from '@/lib/types';

// Tipo de passo reutilizável (poderíamos centralizar em um arquivo separado se necessário)
export type SessionStep = 'create' | 'players' | 'active' | 'cashout' | 'transfers';

interface SessionCreateStepProps {
  currentSession: LiveSession;
  defaultBuyin: number;
  loading: boolean;
  error: string;
  setCurrentSession: (session: LiveSession) => void;
  setDefaultBuyin: (value: number) => void;
  startSession: (location: string) => void;
  setCurrentSessionNull: () => void;
}

export const SessionCreateStep: React.FC<SessionCreateStepProps> = ({
  currentSession,
  defaultBuyin,
  loading,
  error,
  setCurrentSession,
  setDefaultBuyin,
  startSession,
  setCurrentSessionNull
}) => (
  <div className="space-y-8">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Nova Sessão</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure os dados básicos para iniciar uma nova partida
      </p>
    </div>
    {error && (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )}
    <Card>
      <CardHeader>
        <CardTitle>Dados da sessão</CardTitle>
        <CardDescription>
          Defina onde e quando será realizada a partida
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={currentSession?.date}
              onChange={e => setCurrentSession({ ...currentSession, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input
              id="location"
              placeholder="Ex: Clube do João, Casa do Pedro..."
              value={currentSession?.location}
              onChange={e => setCurrentSession({ ...currentSession, location: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="buyin">Buy-in padrão (R$)</Label>
          <Input
            id="buyin"
            type="number"
            value={defaultBuyin}
            onChange={e => setDefaultBuyin(Number(e.target.value) || 50)}
            min="1"
          />
          <p className="text-sm text-muted-foreground">
            Valor inicial que cada jogador pagará ao entrar na mesa
          </p>
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => startSession(currentSession?.location || '')}
            disabled={!currentSession?.location?.trim() || loading}
            className="flex-1"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Iniciar Sessão
          </Button>
          <Button
            variant="outline"
            onClick={setCurrentSessionNull}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);