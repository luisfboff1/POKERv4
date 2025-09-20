import React from 'react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="text-center">
      <div className="py-12">
        <h1 className="text-4xl font-bold mb-4">
          Gerencie suas sessões de poker
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Controle buy-ins, cash-outs e pagamentos em um só lugar
        </p>
        <Link
          to="/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Nova Sessão
          <span className="ml-2">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="text-3xl mb-4">💰</div>
          <h3 className="text-lg font-medium mb-2">Controle Financeiro</h3>
          <p className="text-slate-400">
            Acompanhe buy-ins e cash-outs de cada jogador
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="text-3xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium mb-2">Gestão da Janta</h3>
          <p className="text-slate-400">
            Divida o valor da janta e controle pagamentos
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">Otimização</h3>
          <p className="text-slate-400">
            Sugestões automáticas de transferências
          </p>
        </div>
      </div>
    </div>
  );
}