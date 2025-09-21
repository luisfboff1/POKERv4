import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    plan: 'basic',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const plans = {
    basic: {
      name: 'Basic',
      price: 'R$ 29',
      features: [
        'Até 50 sessões por mês',
        '2 usuários',
        'Relatórios básicos',
        'Suporte por email'
      ]
    },
    premium: {
      name: 'Premium',
      price: 'R$ 59',
      features: [
        'Até 200 sessões por mês',
        '5 usuários',
        'Relatórios avançados',
        'Sistema de convites',
        'Suporte prioritário'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 'R$ 99',
      features: [
        'Sessões ilimitadas',
        'Usuários ilimitados',
        'Relatórios personalizados',
        'API de integração',
        'Suporte dedicado',
        'Treinamento incluído'
      ]
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await register(formData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Erro no cadastro:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Solicitação Enviada!
          </h1>
          <p className="text-gray-600 mb-6">
            Sua solicitação de cadastro foi enviada com sucesso. 
            Em breve você receberá um email com as instruções de acesso.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Próximos passos:</h3>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Aguarde a aprovação do administrador</li>
              <li>2. Você receberá um email de confirmação</li>
              <li>3. Faça login com suas credenciais</li>
              <li>4. Comece a usar o sistema!</li>
            </ol>
          </div>

          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Voltar ao Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 public-page">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-2xl">
            🎯 Poker SaaS
          </div>
          <div className="text-white/80">
            Já tem conta? <Link to="/login" className="text-white underline hover:text-blue-200">Fazer Login</Link>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex">
        {/* Lado esquerdo - Planos */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 text-white">
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold mb-6">
              Escolha o plano ideal para seu grupo
            </h1>
            
            <div className="space-y-6">
              {Object.entries(plans).map(([key, plan]) => (
                <div 
                  key={key}
                  className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 transition-all ${
                    formData.plan === key ? 'border-yellow-400 bg-white/20' : 'border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <span className="text-2xl font-bold">{plan.price}/mês</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Criar Conta
                </h2>
                <p className="text-gray-600">
                  Solicite acesso ao Poker SaaS
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
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
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa/Grupo *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da empresa ou grupo"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                    Plano Desejado *
                  </label>
                  <select
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="basic">Basic - R$ 29/mês</option>
                    <option value="premium">Premium - R$ 59/mês</option>
                    <option value="enterprise">Enterprise - R$ 99/mês</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Conte um pouco sobre seu grupo ou necessidades específicas..."
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.name || !formData.email || !formData.company || !formData.phone}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    'Solicitar Acesso'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>
                  Ao solicitar acesso, você concorda com nossos{' '}
                  <a href="#" className="text-blue-600 hover:underline">Termos de Uso</a>
                  {' '}e{' '}
                  <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>
                </p>
              </div>
            </div>

            {/* Informações sobre aprovação */}
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white text-sm">
              <div className="flex items-start">
                <div className="text-yellow-400 mr-2 mt-0.5">💡</div>
                <div>
                  <div className="font-medium mb-1">Como funciona a aprovação:</div>
                  <ul className="space-y-1 text-white/80">
                    <li>• Sua solicitação será analisada em até 24h</li>
                    <li>• Você receberá um email com o resultado</li>
                    <li>• Após aprovação, poderá fazer login imediatamente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
