import { useState } from 'react';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { UpdateLivePlayerField, LivePlayerEditableField } from '@/app/dashboard/new/steps/types';

export function usePlayerActions(
  currentSession: LiveSession | null,
  setCurrentSession: (s: LiveSession | null) => void,
  defaultBuyin: number,
  createPlayer: (name: string, email?: string) => Promise<any>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addPlayerToSession = async (
    player: { id?: string | number; name?: string; email?: string } | string,
    isExisting: boolean
  ) => {
    if (!currentSession) return;
    if (!player) return;
    const playerName = isExisting && typeof player !== 'string' ? (player.name || '') : (typeof player === 'string' ? player : '');
    if (!playerName.trim()) return;
    const existsInSession = currentSession.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (existsInSession) {
      setError('Jogador já está na mesa');
      return;
    }
    try {
      setLoading(true);
      let playerData: { id?: string | number; name?: string; email?: string } | string = player;
      const email = isExisting && typeof player !== 'string' ? player.email : '';
      const upsertResponse = await createPlayer(playerName, email);
      playerData = (upsertResponse as any).data || upsertResponse; // API wrapper retorna possivelmente {success,data}
      const normalized = typeof playerData === 'string' ? { name: playerData } : playerData;
      const newPlayer: LivePlayer = {
        id: normalized?.id?.toString() || Date.now().toString(),
        name: normalized?.name || playerName,
        email: normalized?.email || '',
        buyin: defaultBuyin,
        totalBuyin: defaultBuyin,
        cashout: 0,
        janta: 0,
        rebuys: [],
        isExisting: true,
        session_paid: false,
        janta_paid: false
      };
      setCurrentSession({
        ...currentSession,
        players: [...currentSession.players, newPlayer]
      });
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar jogador';
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  const updatePlayerField: UpdateLivePlayerField = (playerId, field, value) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      players: currentSession.players.map((p: LivePlayer) => {
        if (p.id === playerId) {
          const updated = { ...p, [field]: value };
          if (field === 'buyin' || field === 'rebuys') {
            updated.totalBuyin = updated.buyin + updated.rebuys.reduce((sum: number, rebuy: number) => sum + rebuy, 0);
          }
          return updated;
        }
        return p;
      })
    });
  };

  const addRebuy = (playerId: string, amount: number) => {
    if (!currentSession) return;
    const player = currentSession.players.find((p: LivePlayer) => p.id === playerId);
    if (player) {
      const newRebuys = [...player.rebuys, amount];
      updatePlayerField(playerId, 'rebuys', newRebuys);
    }
  };

  const removePlayer = (playerId: string) => {
    if (!currentSession) return;
    setCurrentSession({
      ...currentSession,
      players: currentSession.players.filter((p: LivePlayer) => p.id !== playerId)
    });
  };

  return {
    addPlayerToSession,
    updatePlayerField,
    addRebuy,
    removePlayer,
    loading,
    error,
    setError
  };
}
