import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro quando usuário começar a digitar
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (error) {
      // Erro já é tratado pelo contexto
      console.error('Erro no login:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 public-page">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-2xl">
            🎯 Poker SaaS
          </div>
          <div className="text-white/80">
            Não tem conta? <Link to="/register" className="text-white underline hover:text-blue-200">Cadastre-se</Link>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex">
        {/* Lado esquerdo - Informações e planos */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              Gerencie suas sessões de poker como um profissional
            </h1>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>Controle completo de buy-ins e cash-outs</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>Rankings automáticos e estatísticas</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>Convites para jogadores do grupo</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>Sistema de recomendações inteligentes</span>
              </div>
            </div>

            {/* Planos */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Planos Disponíveis</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Basic</span>
                  <span className="font-semibold">R$ 29/mês</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium</span>
                  <span className="font-semibold">R$ 59/mês</span>
                </div>
                <div className="flex justify-between">
                  <span>Enterprise</span>
                  <span className="font-semibold">R$ 99/mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário de login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Fazer Login
                </h2>
                <p className="text-gray-600">
                  Acesse sua conta e gerencie suas sessões
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-red-500 mr-2">⚠️</div>
                    <div className="text-red-700 text-sm">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Sua senha"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.email || !formData.password}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Entrando...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center space-y-4">
                <div className="text-sm text-gray-600">
                  Esqueceu sua senha? <a href="#" className="text-blue-600 hover:underline">Recuperar</a>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Novo por aqui?
                  </div>
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Criar conta gratuita
                  </Link>
                </div>
              </div>
            </div>

            {/* Demo credentials para desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <div className="font-medium text-yellow-800 mb-2">🧪 Credenciais de Demo:</div>
                <div className="text-yellow-700">
                  <div>Email: luisfboff@hotmail.com</div>
                  <div>Senha: Poker2025!</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
