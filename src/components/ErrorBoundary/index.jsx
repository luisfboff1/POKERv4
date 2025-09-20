import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {error.status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
          </h2>
          <p className="text-gray-600 mb-8">
            {error.status === 404
              ? 'A página que você está procurando não existe ou foi movida.'
              : 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
          </p>
          <div className="space-y-4">
            <Link
              to="/poker"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Voltar para o início
            </Link>
            {error.status !== 404 && (
              <p className="text-sm text-gray-500 mt-4">
                Detalhes técnicos: {error.message || 'Erro desconhecido'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600 mb-8">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
          <Link
            to="/poker"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
