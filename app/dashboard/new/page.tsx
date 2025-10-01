"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Plus } from 'lucide-react';
import { useSessions, usePlayers } from '@/hooks/useApi';
import { useModal } from '@/components/ui/modal';
import { useSessionState } from '@/hooks/useSessionState';
import { usePlayerActions } from '@/hooks/usePlayerActions';
import { useTransferRecommendations } from '@/hooks/useTransferRecommendations';
import type { LiveSession, TransferRecommendation } from '@/lib/types';

// Componentes de etapas
import { SessionCreateStep, SessionStep } from './steps/SessionCreateStep';
import { SessionPlayersStep } from './steps/SessionPlayersStep';
import { SessionActiveStep } from './steps/SessionActiveStep';
import { SessionCashoutStep } from './steps/SessionCashoutStep';
import { SessionTransfersStep } from './steps/SessionTransfersStep';

// Modais
import { AddPlayerModal } from './modals/AddPlayerModal';
import { PlayersListModal } from './modals/PlayersListModal';
import { SuggestionModal } from './modals/SuggestionModal';

export default function CurrentSessionPage() {
  const router = useRouter();
  const { createSession } = useSessions();
  const { players: existingPlayers, createPlayer } = usePlayers();

  // Hooks de estado
  const { currentSession, setCurrentSession, step, setStep, clearCache } = useSessionState();
  const [defaultBuyin, setDefaultBuyin] = useState(50);
  const [searchPlayer, setSearchPlayer] = useState('');
  const [suggestionForm, setSuggestionForm] = useState({ from: '', to: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ações de jogadores
  const {
    addPlayerToSession,
    updatePlayerField,
    addRebuy,
    removePlayer,
    loading: playerLoading,
    error: playerError,
    setError: setPlayerError
  } = usePlayerActions(currentSession, setCurrentSession, defaultBuyin, createPlayer);

  // Recomendações de transferência
  const {
    recommendations,
    manualSuggestions,
    calculateRecommendations,
    addManualSuggestion: addManualSuggestionRaw,
    removeManualSuggestion,
    setManualSuggestions
  } = useTransferRecommendations(currentSession);

  // Modais
  const suggestionModal = useModal();
  const playersListModal = useModal();
  const addPlayerModal = useModal();

  // Criar nova sessão
  const createNewSession = () => {
    const newSession: LiveSession = {
      date: new Date().toISOString().split('T')[0],
      location: '',
      status: 'creating',
      players: []
    };
    setCurrentSession(newSession);
    setStep('create');
  };

  // Iniciar sessão (apenas local)
  const startSession = (location: string) => {
    if (!currentSession) return;
    const sessionData = { ...currentSession, location, status: 'players' as const };
    setCurrentSession(sessionData);
    setStep('players');
  };

  // Finalizar sessão e salvar
  const finishSession = async () => {
    if (!currentSession) return;
    setLoading(true);
    try {
      const finalPlayers = currentSession.players.map(p => ({
        ...p,
        balance: p.cashout - p.totalBuyin
      }));
      await createSession({
        date: currentSession.date,
        location: currentSession.location,
        status: 'approved',
        players_data: finalPlayers,
        recommendations
      });
      clearCache();
      setCurrentSession(null);
      setStep('create');
      router.push('/dashboard/history');
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar sessão');
    } finally {
      setLoading(false);
    }
  };

  // Totais e derivados
  const totals = currentSession ? {
    totalBuyin: currentSession.players.reduce((sum, p) => sum + p.totalBuyin, 0),
    totalCashout: currentSession.players.reduce((sum, p) => sum + p.cashout, 0),
    totalJanta: currentSession.players.reduce((sum, p) => sum + p.janta, 0),
    playersCount: currentSession.players.length
  } : { totalBuyin: 0, totalCashout: 0, totalJanta: 0, playersCount: 0 };
  const isBalanced = totals.totalBuyin === totals.totalCashout;

  const filteredExistingPlayers = (existingPlayers || []).filter(p => {
    if (!p?.name) return false;
    if (!searchPlayer.trim()) return true;
    return p.name.toLowerCase().includes(searchPlayer.toLowerCase());
  });

  // Wrapper para adicionar sugestão manual usando formulário local
  const handleAddManualSuggestion = () => {
    const { from, to, amount } = suggestionForm;
    if (!from || !to || !amount) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    if (from === to) {
      setError('Pagador e recebedor devem ser diferentes');
      return;
    }
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }
    const fromExists = currentSession?.players.some(p => p.name === from);
    const toExists = currentSession?.players.some(p => p.name === to);
    if (!fromExists || !toExists) {
      setError('Jogadores devem estar na sessão atual');
      return;
    }
    addManualSuggestionRaw({ from, to, amount: amountNum } as TransferRecommendation);
    setSuggestionForm({ from: '', to: '', amount: '' });
    suggestionModal.close();
    setError('');
  };

  // Render sem sessão
  if (!currentSession) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <Play className="h-8 w-8 text-primary" />
            Sessão Atual
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie uma sessão de poker em tempo real</p>
        </div>
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Play className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma sessão ativa</h3>
              <p className="text-muted-foreground">Crie uma nova sessão para começar a gerenciar uma partida de poker</p>
            </div>
            <Button onClick={createNewSession} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Nova Sessão
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Escolher etapa
  let content: React.ReactNode = null;
  if (step === 'create') {
    content = (
      <SessionCreateStep
        currentSession={currentSession}
        defaultBuyin={defaultBuyin}
        loading={loading}
        error={error || playerError}
        setCurrentSession={setCurrentSession}
        setDefaultBuyin={setDefaultBuyin}
        startSession={startSession}
        setCurrentSessionNull={() => setCurrentSession(null)}
      />
    );
  } else if (step === 'players') {
    content = (
      <SessionPlayersStep
        currentSession={currentSession}
        defaultBuyin={defaultBuyin}
        error={error || playerError}
        searchPlayer={searchPlayer}
        setSearchPlayer={setSearchPlayer}
        filteredExistingPlayers={filteredExistingPlayers}
        addPlayerToSession={addPlayerToSession}
        addPlayerModal={addPlayerModal}
        playersListModal={playersListModal}
        removePlayer={removePlayer}
        totals={totals}
        setStep={setStep as (s: SessionStep) => void}
      />
    );
  } else if (step === 'active') {
    content = (
      <SessionActiveStep
        currentSession={currentSession}
        totals={totals}
        addPlayerModal={addPlayerModal}
        setStep={setStep as (s: SessionStep) => void}
        updatePlayerField={updatePlayerField}
        addRebuy={addRebuy}
      />
    );
  } else if (step === 'cashout') {
    content = (
      <SessionCashoutStep
        currentSession={currentSession}
        totals={totals}
        isBalanced={isBalanced}
        updatePlayerField={updatePlayerField}
        setStep={setStep as (s: SessionStep) => void}
        calculateRecommendations={calculateRecommendations}
      />
    );
  } else if (step === 'transfers') {
    content = (
      <SessionTransfersStep
        currentSession={currentSession}
        totals={totals}
        recommendations={recommendations}
        manualSuggestions={manualSuggestions}
        loading={loading}
        finishSession={finishSession}
        setStep={setStep as (s: SessionStep) => void}
        suggestionModal={suggestionModal}
        removeManualSuggestion={removeManualSuggestion}
      />
    );
  }

  return (
    <div className="space-y-6">
      {content}
      <AddPlayerModal
        isOpen={addPlayerModal.isOpen}
        onClose={() => { addPlayerModal.close(); setSearchPlayer(''); }}
        searchPlayer={searchPlayer}
        setSearchPlayer={setSearchPlayer}
        filteredExistingPlayers={filteredExistingPlayers}
        addPlayerToSession={addPlayerToSession}
      />
      <PlayersListModal
        isOpen={playersListModal.isOpen}
        onClose={playersListModal.close}
        existingPlayers={existingPlayers}
        currentSession={currentSession}
        addPlayerToSession={addPlayerToSession}
      />
      <SuggestionModal
        isOpen={suggestionModal.isOpen}
        onClose={() => { suggestionModal.close(); setSuggestionForm({ from: '', to: '', amount: '' }); setError(''); }}
        error={error}
        suggestionForm={suggestionForm}
        setSuggestionForm={setSuggestionForm}
        currentSession={currentSession}
        addManualSuggestion={handleAddManualSuggestion}
      />
    </div>
  );
}

