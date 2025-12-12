'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { CheckCircle, XCircle, Calendar, MapPin, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackfillSuggestion {
  session_id: number;
  session_date: string;
  session_location: string;
  session_status: string;
  player_count: number;
  suggested_period_id: number | null;
  suggested_period_name: string | null;
  suggested_period_range: string | null;
}

export default function BackfillPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<BackfillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await api.sessions.getBackfillSuggestions();
      setSuggestions(response.data.suggestions || []);

      // Auto-select all sessions with suggestions
      const autoSelect = new Set(
        response.data.suggestions
          .filter((s: BackfillSuggestion) => s.suggested_period_id !== null)
          .map((s: BackfillSuggestion) => s.session_id)
      );
      setSelectedSessions(autoSelect);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar sugestões de períodos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBackfill = async () => {
    try {
      setApplying(true);

      const assignments = suggestions
        .filter(s => selectedSessions.has(s.session_id))
        .map(s => ({
          session_id: s.session_id,
          period_id: s.suggested_period_id,
        }));

      if (assignments.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhuma sessão selecionada para atualizar',
        });
        return;
      }

      await api.sessions.applyBackfill(assignments);

      toast({
        title: 'Sucesso',
        description: `${assignments.length} sessões foram associadas aos períodos`,
      });

      // Reload suggestions
      await loadSuggestions();
    } catch (error) {
      console.error('Error applying backfill:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao aplicar associações',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const toggleSession = (sessionId: number) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const toggleAll = (sessions: BackfillSuggestion[]) => {
    const sessionIds = sessions.map(s => s.session_id);
    const allSelected = sessionIds.every(id => selectedSessions.has(id));

    const newSelected = new Set(selectedSessions);
    if (allSelected) {
      // Deselect all
      sessionIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all
      sessionIds.forEach(id => newSelected.add(id));
    }
    setSelectedSessions(newSelected);
  };

  if (loading) {
    return <LoadingState text="Carregando sugestões..." />;
  }

  const sessionsWithSuggestions = suggestions.filter(s => s.suggested_period_id !== null);
  const sessionsWithoutMatch = suggestions.filter(s => s.suggested_period_id === null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Associar sessões antigas a períodos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisar e aprovar sugestões automáticas de associação
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>
            Status das sessões não associadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{suggestions.length}</div>
              <div className="text-sm text-muted-foreground">Total não associadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionsWithSuggestions.length}</div>
              <div className="text-sm text-muted-foreground">Com sugestões</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{sessionsWithoutMatch.length}</div>
              <div className="text-sm text-muted-foreground">Sem correspondência</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions with suggestions */}
      {sessionsWithSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sessões com sugestões ({sessionsWithSuggestions.length})</CardTitle>
                <CardDescription>
                  Revise as sugestões e aplique as associações
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(sessionsWithSuggestions)}
                >
                  {sessionsWithSuggestions.every(s => selectedSessions.has(s.session_id)) ? 'Desmarcar todas' : 'Selecionar todas'}
                </Button>
                <Button
                  onClick={handleApplyBackfill}
                  disabled={applying || selectedSessions.size === 0}
                >
                  {applying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    `Aplicar ${selectedSessions.size} selecionadas`
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionsWithSuggestions.map(suggestion => (
                <div
                  key={suggestion.session_id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${selectedSessions.has(suggestion.session_id)
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-border hover:bg-muted/50'
                    }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(suggestion.session_id)}
                      onChange={() => toggleSession(suggestion.session_id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(suggestion.session_date).toLocaleDateString('pt-BR')}
                        </span>
                        <MapPin className="h-4 w-4 text-muted-foreground ml-2" />
                        <span className="text-sm text-muted-foreground">
                          {suggestion.session_location}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.player_count} jogadores • Status: {suggestion.session_status}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">{suggestion.suggested_period_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {suggestion.suggested_period_range}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions without match */}
      {sessionsWithoutMatch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessões sem correspondência ({sessionsWithoutMatch.length})</CardTitle>
            <CardDescription>
              Estas sessões estão fora de qualquer período existente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionsWithoutMatch.map(suggestion => (
                <div
                  key={suggestion.session_id}
                  className="flex items-center justify-between p-4 border border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <XCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(suggestion.session_date).toLocaleDateString('pt-BR')}
                        </span>
                        <MapPin className="h-4 w-4 text-muted-foreground ml-2" />
                        <span className="text-sm text-muted-foreground">
                          {suggestion.session_location}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.player_count} jogadores • Status: {suggestion.session_status}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">
                    Crie um período que inclua esta data
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo certo!</h3>
            <p className="text-muted-foreground">
              Todas as sessões já estão associadas a períodos de ranking.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
