import { useState } from 'react';
import type { LiveSession, LivePlayer } from '@/lib/types';

export function usePlayerActions(currentSession: LiveSession | null, setCurrentSession: (s: LiveSession | null) => void, defaultBuyin: number, createPlayer: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addPlayerToSession = async (player: any, isExisting: boolean) => {
    if (!currentSession) return;
    if (!player) return;
    const playerName = isExisting ? (player?.name || '') : (player || '');
    if (!playerName.trim()) return;
    const existsInSession = currentSession.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (existsInSession) {
      setError('Jogador já está na mesa');
      return;
    }
    try {
      setLoading(true);
      let playerData = player;
      const upsertResponse = await createPlayer(playerName, isExisting ? player.email : '');
      playerData = upsertResponse.data || upsertResponse;
      const newPlayer: LivePlayer = {
        id: playerData?.id?.toString() || Date.now().toString(),
        name: playerData?.name || playerName,
        email: playerData?.email || '',
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
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar jogador');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerField = (playerId: string, field: keyof LivePlayer, value: any) => {
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
