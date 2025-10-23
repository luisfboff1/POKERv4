
"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';


type InviteData = {
  email: string;
  tenant_name: string;
  invited_by_name: string;
  expires_at: string;
  role: string;
} | null;

function AcceptInviteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle, loginWithMicrosoft } = useAuth();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de convite inválido.');
      setLoading(false);
      return;
    }
    
    // For now, we'll set dummy invite data since the validation endpoint needs to be created
    // In production, this should validate the token with the API
    setLoading(false);
    setInvite({
      email: 'user@example.com',
      tenant_name: 'Example Tenant',
      invited_by_name: 'Admin',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      role: 'player',
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.invites.accept(token!, password, name);
      
      if (response.success) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando para login...');
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      } else {
        setError(response.error || 'Erro ao aceitar convite.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccept = async () => {
    try {
      setError('');
      setLoading(true);
      // Store the invite token in session storage to use after OAuth redirect
      if (token) {
        sessionStorage.setItem('invite_token', token);
      }
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login com Google');
      setLoading(false);
    }
  };

  const handleMicrosoftAccept = async () => {
    try {
      setError('');
      setLoading(true);
      // Store the invite token in session storage to use after OAuth redirect
      if (token) {
        sessionStorage.setItem('invite_token', token);
      }
      await loginWithMicrosoft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login com Microsoft');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>
            Complete seu cadastro para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !invite && <p className="text-center text-muted-foreground">Carregando...</p>}
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {invite && !success && (
            <>
              <div className="mb-6 space-y-2 rounded-md bg-muted p-4 text-sm">
                <div><strong>Email:</strong> {invite.email}</div>
                <div><strong>Grupo:</strong> {invite.tenant_name}</div>
                <div><strong>Convidado por:</strong> {invite.invited_by_name}</div>
                <div><strong>Função:</strong> {invite.role}</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name"
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Seu nome"
                    required 
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password"
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Mínimo 6 caracteres"
                    required 
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input 
                    id="confirmPassword"
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Digite a senha novamente"
                    required 
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Processando...' : 'Aceitar convite'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou aceite com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAccept}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMicrosoftAccept}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  Microsoft
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
      <AcceptInviteClient />
    </Suspense>
  );
}
