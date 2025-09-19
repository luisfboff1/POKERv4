import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionForm } from '../../components/SessionForm';
import { TransferList } from '../../components/TransferList';
import { sessionApi } from '../../services/api';

export function EditSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionApi.list();
      const session = response.data.find(s => s.id === parseInt(id));
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      console.log('Dados carregados:', session); // Debug

      setSessionData({
        date: session.date,
        players: session.players_data || [],
        recommendations: session.recommendations || []
      });
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionDataChange = (newData) => {
    console.log('Dados atualizados:', newData); // Debug
    setSessionData(newData);
  };

  const handleSaveSession = async (data) => {
    try {
      setIsSaving(true);
      setError(null);

      console.log('Salvando dados:', data); // Debug

      const result = await sessionApi.update(id, {
        date: data.date,
        players: data.players,
        recommendations: data.recommendations || []
      });
      
      if (result.error) {
        throw new Error(result.error);
      }

      alert('Sessão atualizada com sucesso!');
      // Recarrega os dados atualizados
      await loadSession();
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      setError(error.message);
      alert('Erro ao atualizar sessão: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl mb-2">Carregando sessão...</div>
          <div className="text-gray-500">Aguarde um momento</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl mb-2 text-red-500">Erro ao carregar sessão</div>
          <div className="text-gray-500 mb-4">{error}</div>
          <button
            onClick={() => navigate('/history')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Voltar para o histórico
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl mb-2">Sessão não encontrada</div>
          <button
            onClick={() => navigate('/history')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Voltar para o histórico
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Editar Sessão</h1>
            <p className="text-slate-400">Atualize os valores e jogadores</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-gray-500 hover:text-gray-700"
          >
            Voltar para o histórico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SessionForm 
            initialData={sessionData}
            onDataChange={handleSessionDataChange}
            onSave={handleSaveSession}
            disabled={isSaving}
          />
        </div>

        <div className="lg:col-span-1">
          <TransferList 
            players={sessionData.players} 
            recommendations={sessionData.recommendations}
            onUpdateOptimization={() => {
              setSessionData({...sessionData});
            }}
          />
        </div>
      </div>
    </div>
  );
}