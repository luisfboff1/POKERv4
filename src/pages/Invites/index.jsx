import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const Invites = () => {
  const { user, getTenantInfo } = useAuth();
  const [invites, setInvites] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]); // NOVO: Membros do grupo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [activeSection, setActiveSection] = useState('members'); // NOVO: Seção ativa
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'user'
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  const tenantInfo = getTenantInfo();

  useEffect(() => {
    loadInvites();
    loadGroupMembers();
  }, []);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const [invitesResponse, pendingResponse] = await Promise.all([
        api.getInvites(),
        api.getPendingInvites()
      ]);

      setInvites(invitesResponse.data || []);
      setPendingInvites(pendingResponse.data || []);
    } catch (error) {
      setError('Erro ao carregar convites: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async () => {
    try {
      const response = await api.getGroupMembers();
      setGroupMembers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setError('Erro ao carregar membros do grupo');
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja remover "${userName}" do grupo? Esta ação não pode ser desfeita.`)) {
      try {
        await api.removeMemberFromGroup(userId);
        alert('Membro removido com sucesso!');
        loadGroupMembers(); // Recarregar lista
      } catch (error) {
        console.error('Erro ao remover membro:', error);
        alert('Erro ao remover membro: ' + error.message);
      }
    }
  };

  const handleResetMemberPassword = async (userId, userName) => {
    const newPassword = prompt(`Digite a nova senha para "${userName}" (mínimo 6 caracteres):`);
    
    if (newPassword && newPassword.length >= 6) {
      try {
        await api.resetMemberPassword(userId, newPassword);
        alert(`Senha de "${userName}" alterada com sucesso!`);
      } catch (error) {
        console.error('Erro ao alterar senha:', error);
        alert('Erro ao alterar senha: ' + error.message);
      }
    } else if (newPassword) {
      alert('Senha deve ter pelo menos 6 caracteres');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteForm.email || !inviteForm.name) {
      return;
    }

    try {
      setSendingInvite(true);
      await api.sendInvite(inviteForm);
      
      // Resetar formulário
      setInviteForm({ email: '', name: '', role: 'user' });
      setShowInviteForm(false);
      
      // Recarregar convites
      await loadInvites();
      
      alert('Convite enviado com sucesso!');
    } catch (error) {
      alert('Erro ao enviar convite: ' + error.message);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) {
      return;
    }

    try {
      await api.cancelInvite(inviteId);
      await loadInvites();
      alert('Convite cancelado com sucesso!');
    } catch (error) {
      alert('Erro ao cancelar convite: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceito';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            👥 Convidados
          </h1>
          <p className="text-slate-400">
            Gerencie membros e convites para {tenantInfo?.name}
          </p>
        </div>
        
        <button
          onClick={() => setShowInviteForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          📧 Enviar Convite
        </button>
      </div>

      {/* Abas */}
      <div className="mb-8">
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'members', label: '👥 Membros do Grupo', icon: '👥' },
              { id: 'invites', label: '📧 Convites Pendentes', icon: '📧' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Aba Membros do Grupo */}
      {activeSection === 'members' && (
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">👥 Membros do Grupo</h3>
            <p className="text-slate-400 text-sm">
              {groupMembers.length} membro(s) ativo(s) no grupo
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Membro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Desde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {groupMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{member.name}</div>
                          <div className="text-sm text-slate-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {member.role === 'admin' ? 'Administrador' : 'Membro'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {member.last_login ? new Date(member.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetMemberPassword(member.id, member.name)}
                          className="text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40 px-3 py-1 rounded text-xs"
                          title="Redefinir senha"
                        >
                          🔑 Senha
                        </button>
                        {member.role !== 'admin' && member.id !== user?.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-3 py-1 rounded text-xs"
                            title="Remover do grupo"
                          >
                            🗑️ Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {groupMembers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400">
                  <div className="text-4xl mb-4">👥</div>
                  <p>Nenhum membro no grupo ainda</p>
                  <p className="text-sm mt-2">Envie convites para adicionar membros</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aba Convites Pendentes */}
      {activeSection === 'invites' && (

      {/* Modal de novo convite */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Novo Convite</h2>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do convidado"
                  required
                  disabled={sendingInvite}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                  required
                  disabled={sendingInvite}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Papel
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  disabled={sendingInvite}
                >
                  <option value="user">Membro (visualização)</option>
                  <option value="admin">Administrador (pode editar)</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                  disabled={sendingInvite}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={sendingInvite || !inviteForm.email || !inviteForm.name}
                >
                  {sendingInvite ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convites pendentes */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">🕐 Convites Pendentes</h2>
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Convidado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Enviado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Expira em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {invite.name || 'Nome não informado'}
                          </div>
                          <div className="text-sm text-slate-400">{invite.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invite.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {invite.role === 'admin' ? 'Administrador' : 'Membro'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(invite.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(invite.expires_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Histórico de convites */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">📋 Histórico de Convites</h2>
        
        {invites.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum convite enviado ainda</h3>
            <p className="text-slate-400 mb-6">
              Comece convidando membros para seu grupo!
            </p>
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar Primeiro Convite
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Convidado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Papel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Enviado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Por
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {invites.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {invite.name || 'Nome não informado'}
                          </div>
                          <div className="text-sm text-slate-400">{invite.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invite.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {invite.role === 'admin' ? 'Administrador' : 'Membro'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invite.status)}`}>
                          {getStatusText(invite.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(invite.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {invite.invited_by_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invites;
