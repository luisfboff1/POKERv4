import React from 'react';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LiveSession, LivePlayer } from '@/lib/types';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  suggestionForm: { from: string; to: string; amount: string };
  setSuggestionForm: (v: { from: string; to: string; amount: string }) => void;
  currentSession: LiveSession | null;
  addManualSuggestion: () => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  isOpen,
  onClose,
  error,
  suggestionForm,
  setSuggestionForm,
  currentSession,
  addManualSuggestion
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Sugerir Pagamento" description="Configure um pagamento específico entre jogadores" size="md">
    <ModalContent>
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm mb-4">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">Quem paga</Label>
          <select
            id="from"
            value={suggestionForm.from}
            onChange={e => setSuggestionForm({ ...suggestionForm, from: e.target.value })}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">Selecione o pagador</option>
            {currentSession?.players.map((player: LivePlayer) => (
              <option key={player.id} value={player.name}>{player.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSuggestionForm({ from: suggestionForm.to, to: suggestionForm.from, amount: suggestionForm.amount })}
            disabled={!suggestionForm.from && !suggestionForm.to}
          >
            ↕ Trocar
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Quem recebe</Label>
          <select
            id="to"
            value={suggestionForm.to}
            onChange={e => setSuggestionForm({ ...suggestionForm, to: e.target.value })}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">Selecione o recebedor</option>
            {currentSession?.players.map((player: LivePlayer) => (
              <option key={player.id} value={player.name}>{player.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          min="0.01"
          step="0.01"
          value={suggestionForm.amount}
          onChange={e => setSuggestionForm({ ...suggestionForm, amount: e.target.value })}
        />
      </div>
    </ModalContent>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={addManualSuggestion} disabled={!suggestionForm.from || !suggestionForm.to || !suggestionForm.amount}>Adicionar Sugestão</Button>
    </ModalFooter>
  </Modal>
);