import React, { useState } from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

const PlayerStatsSyncManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const syncStats = async (type: 'sync_all' | 'reset_all') => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sync_players_stats.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          action: type
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          data: data.data
        });
        setLastSync(new Date());
        
        // Recarregar a página após sincronização
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Erro ao sincronizar estatísticas'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sincronização de Estatísticas
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {lastSync && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              Última sincronização: {lastSync.toLocaleString()}
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Problema detectado
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                As estatísticas do ranking podem estar desatualizadas. Quando você exclui sessões 
                do histórico, as estatísticas consolidadas não são atualizadas automaticamente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => syncStats('sync_all')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar Estatísticas
          </button>

          <button
            onClick={() => syncStats('reset_all')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Resetar e Recalcular Tudo
          </button>
        </div>

        {result && (
          <div className={`rounded-md p-4 ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm">
                <p className={`font-medium mb-1 ${
                  result.success 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.success ? 'Sucesso!' : 'Erro'}
                </p>
                <p className={
                  result.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }>
                  {result.message}
                </p>
                {result.success && result.data && (
                  <p className="text-green-600 dark:text-green-400 mt-2">
                    {Array.isArray(result.data) 
                      ? `${result.data.length} jogador(es) atualizados`
                      : 'Página será recarregada em 2 segundos...'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Sincronizar:</strong> Recalcula estatísticas baseadas nas sessões existentes</p>
          <p><strong>Resetar:</strong> Zera tudo e recalcula do zero (use se houver inconsistências graves)</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsSyncManager;