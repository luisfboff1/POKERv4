import type { LivePlayer } from '@/lib/types';

// Campos de LivePlayer que podem ser alterados dinamicamente durante a sessão
export type LivePlayerEditableField = 'buyin' | 'rebuys' | 'janta' | 'cashout' | 'session_paid' | 'janta_paid';

// Assinatura utilitária para a função de atualização
export type UpdateLivePlayerField = <K extends LivePlayerEditableField>(
  playerId: string,
  field: K,
  value: LivePlayer[K]
) => void;
