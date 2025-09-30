'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-2xl">
            🎯 Poker Manager
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-white/80">
              Não tem conta?{' '}
              <Link href="/register" className="text-white underline hover:text-blue-200">
                Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen flex">
        {/* Lado esquerdo - Informações */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              Gerencie suas sessões de poker como um profissional
            </h1>
            
            <div className="space-y-4 mb-8">
              {[
                'Controle completo de buy-ins e cash-outs',
                'Rankings automáticos e estatísticas',
                'Convites para jogadores do grupo',
                'Sistema de recomendações inteligentes'
              ].map((feature, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    ✓
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário de login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Fazer Login</CardTitle>
                <CardDescription>
                  Acesse sua conta e gerencie suas sessões
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-red-500 mr-2">⚠️</div>
                      <div className="text-red-700 text-sm">{error}</div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Sua senha"
                        required
                        disabled={loading}
                        className="pr-12"
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

                  <Button
                    type="submit"
                    disabled={loading || !formData.email || !formData.password}
                    className="w-full"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Entrando...
                      </div>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <div className="text-sm text-gray-600">
                    Esqueceu sua senha?{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Recuperar
                    </a>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">
                      Novo por aqui?
                    </div>
                    <Link 
                      href="/register" 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Criar conta gratuita
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

