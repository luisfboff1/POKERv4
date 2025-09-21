import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isAccepting, setIsAccepting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateInvite();
    } else {
      setError('Token de convite inválido');
      setLoading(false);
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      const response = await fetch(`/api/accept_invite.php?action=validate&token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setInviteData(data.data);
        setFormData(prev => ({
          ...prev,
          name: data.data.name || ''
        }));
      } else {
        setError(data.error || 'Convite inválido ou expirado');
      }
    } catch (error) {
      setError('Erro ao validar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não conferem');
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsAccepting(true);
    setError('');

    try {
      const response = await fetch('/api/accept_invite.php?action=accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          name: formData.name,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Sucesso - redirecionar para login
        alert('🎉 Convite aceito com sucesso! Faça login com suas credenciais.');
        navigate('/login');
      } else {
        setError(data.error || 'Erro ao aceitar convite');
      }
    } catch (error) {
      setError('Erro ao processar convite');
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Validando Convite</h2>
            <p className="text-gray-600">Aguarde um momento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-purple-600 to-red-800 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-white font-bold text-2xl">
            🎯 Poker SaaS
          </div>
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Você foi convidado!
            </h2>
            <p className="text-gray-600">
              Complete seu cadastro para participar
            </p>
          </div>

          {/* Informações do Convite */}
          {inviteData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Detalhes do Convite</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Grupo:</strong> {inviteData.tenant_name}</div>
                <div><strong>Convidado por:</strong> {inviteData.invited_by_name}</div>
                <div><strong>Email:</strong> {inviteData.email}</div>
                <div><strong>Papel:</strong> {inviteData.role === 'admin' ? 'Administrador' : 'Membro'}</div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">⚠️</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome completo"
                required
                disabled={isAccepting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Criar Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isAccepting}
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite a senha novamente"
                required
                disabled={isAccepting}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isAccepting || !formData.name || !formData.password || !formData.confirmPassword}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAccepting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Aceitando convite...
                </div>
              ) : (
                '🚀 Aceitar Convite e Entrar'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600">
              Já tem uma conta? 
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline ml-1"
              >
                Fazer login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
