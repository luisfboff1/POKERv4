import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionForm } from '../../components/SessionForm';
import { TransferList } from '../../components/TransferList';
import { sessionApi } from '../../services/api';

export function NewSession() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado compartilhado entre o formulário e a lista de transferências
  const [sessionData, setSessionData] = useState({
    players: [],
    recommendations: []
  });

  // Handler para atualizar os dados da sessão
  const handleSessionDataChange = (newData) => {
    setSessionData(newData);
  };

  // Handler para salvar a sessão
  const handleSaveSession = async (data) => {
    try {
      setIsSaving(true);
      const result = await sessionApi.create(data);
      
      if (result.error) {
        throw new Error(result.error);
      }

      alert('Sessão salva com sucesso!');
      navigate('/history'); // Redireciona para o histórico
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      alert('Erro ao salvar sessão: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Nova Sessão</h1>
        <p className="text-slate-400">Adicione jogadores e controle os valores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário e Lista de Jogadores */}
        <div className="lg:col-span-2">
          <SessionForm 
            onDataChange={handleSessionDataChange}
            onSave={handleSaveSession}
            disabled={isSaving}
          />
        </div>

        {/* Painel de Transferências */}
        <div className="lg:col-span-1">
          <TransferList 
            players={sessionData.players} 
            recommendations={sessionData.recommendations}
            onUpdateOptimization={() => {
              // Força uma atualização da otimização
              setSessionData({...sessionData});
            }}
          />
        </div>
      </div>
    </div>
  );
}