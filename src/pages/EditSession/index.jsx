import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SessionForm } from '../../components/SessionForm';
import { TransferList } from '../../components/TransferList';
import { sessionApi } from '../../services/api';

export function EditSession() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionData, setSessionData] = useState({
    players: [],
    recommendations: []
  });

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.list();
      const session = response.data.find(s => s.id === parseInt(id));
      if (session) {
        setSessionData({
          date: session.date,
          players: session.players_data || [],
          recommendations: session.recommendations || []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      alert('Erro ao carregar sessão: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionDataChange = (newData) => {
    setSessionData(newData);
  };

  const handleSaveSession = async (data) => {
    try {
      setIsSaving(true);
      const result = await sessionApi.update(id, data);
      
      if (result.error) {
        throw new Error(result.error);
      }

      alert('Sessão atualizada com sucesso!');
      // Recarrega os dados atualizados
      await loadSession();
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      alert('Erro ao atualizar sessão: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center">Carregando sessão...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Editar Sessão</h1>
        <p className="text-slate-400">Atualize os valores e jogadores</p>
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
