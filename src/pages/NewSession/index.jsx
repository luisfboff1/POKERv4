import React from 'react';
import { SessionManager } from '../../components/SessionManager';

export function NewSession() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Sessão</h1>
        <p className="text-slate-400">Adicione jogadores e controle os valores</p>
      </div>

      <SessionManager />
    </div>
  );
}