
"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


type InviteData = {
  email: string;
  tenant_name: string;
  invited_by_name: string;
  expires_at: string;
} | null;

function AcceptInviteClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de convite inválido.');
      setLoading(false);
      return;
    }
    fetch(`/api/accept_invite.php?token=${token}&action=validate`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInvite(data.data);
        } else {
          setError(data.error || 'Convite inválido ou expirado.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao validar convite.');
        setLoading(false);
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
    setLoading(true);
    const res = await fetch(`/api/accept_invite.php?token=${token}&action=accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    const data = await res.json();
    if (data.success) {
      setSuccess('Cadastro realizado com sucesso! Faça login para acessar.');
    } else {
      setError(data.error || 'Erro ao aceitar convite.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Carregando...</p>}
          {error && <p className="text-destructive mb-2">{error}</p>}
          {success && <p className="text-success mb-2">{success}</p>}
          {invite && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Senha</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">Aceitar convite</Button>
            </form>
          )}
          {invite && (
            <div className="mt-4 text-xs text-muted-foreground">
              <div><b>Email:</b> {invite.email}</div>
              <div><b>Grupo:</b> {invite.tenant_name}</div>
              <div><b>Convidado por:</b> {invite.invited_by_name}</div>
              <div><b>Expira em:</b> {invite.expires_at}</div>
            </div>
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
