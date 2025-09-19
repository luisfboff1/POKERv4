import React from 'react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="text-center">
      {/* Hero Section */}
      <div className="py-12">
        <h1 className="text-4xl font-bold mb-4">
          Gerencie suas sessões de poker com facilidade
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Controle buy-ins, cash-outs, janta e pagamentos em um só lugar
        </p>
        <Link
          to="/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Começar Nova Sessão
          <span className="ml-2">→</span>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="text-3xl mb-4">💰</div>
          <h3 className="text-lg font-medium mb-2">Controle Financeiro</h3>
          <p className="text-slate-400">
            Acompanhe buy-ins, rebuys e cash-outs de cada jogador
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="text-3xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium mb-2">Gestão da Janta</h3>
          <p className="text-slate-400">
            Divida o valor da janta e controle quem já pagou
          </p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">Otimização</h3>
          <p className="text-slate-400">
            Veja sugestões de transferências para facilitar os pagamentos
          </p>
        </div>
      </div>

      {/* Latest Sessions */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Últimas Sessões</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exemplo de sessão */}
          <div className="bg-slate-800 p-6 rounded-lg text-left">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">Sessão #123</h3>
                <p className="text-slate-400 text-sm">19/09/2025</p>
              </div>
              <span className="bg-green-600/10 text-green-400 text-sm px-2 py-1 rounded">
                Finalizada
              </span>
            </div>
            <div className="space-y-1 text-sm text-slate-400">
              <p>4 jogadores • Buy-in: R$ 50,00</p>
              <p>Total em jogo: R$ 200,00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}