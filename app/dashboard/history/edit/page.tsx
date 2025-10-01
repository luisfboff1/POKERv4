"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSessions } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/format';
import type { Session } from '@/lib/types';
import { LoadingSpinner } from '@/components/ui/loading';

interface PlayerPaymentRow {
  id?: string | number;
  name: string;
  buyin: number;
  totalBuyin?: number;
  cashout: number;
  janta?: number;
  session_paid?: boolean;
  janta_paid?: boolean;
}

export default function EditSessionPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { sessions, loading, updateSessionPayments } = useSessions();
  const sessionId = useMemo(() => {
    const raw = search.get('id');
    if (!raw) return null;
    return parseInt(raw, 10);
  }, [search]);

  const session: Session | undefined = sessions.find(s => s.id === sessionId);
  const [players, setPlayers] = useState<PlayerPaymentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session) {
      const mapped = (session.players_data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        buyin: p.buyin ?? p.totalBuyin ?? 0,
        totalBuyin: p.totalBuyin ?? p.buyin ?? 0,
        cashout: p.cashout ?? 0,
        janta: p.janta ?? 0,
        session_paid: !!p.session_paid,
        janta_paid: !!p.janta_paid,
      }));
      setPlayers(mapped);
    }
  }, [session]);

  const originalStateRef = useMemo(() => {
    if (!session) return [] as Array<{ key: string | number; session_paid: boolean; janta_paid: boolean }>;
    return (session.players_data || []).map((p: any) => ({
      key: p.id ?? p.name,
      session_paid: !!p.session_paid,
      janta_paid: !!p.janta_paid,
    }));
  }, [session]);

  const dirty = useMemo(() => {
    return players.some(p => {
      const key = (p.id ?? p.name) as string | number;
      const original = originalStateRef.find(o => o.key === key);
      if (!original) return true;
      return original.session_paid !== !!p.session_paid || original.janta_paid !== !!p.janta_paid;
    });
  }, [players, originalStateRef]);

  const handleToggle = (index: number, field: 'session_paid' | 'janta_paid') => {
    setPlayers(prev => prev.map((p,i) => i === index ? { ...p, [field]: !p[field] } : p));
  };

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const payload = players.map(p => ({
        id: p.id,
        name: p.name,
        session_paid: p.session_paid,
        janta_paid: p.janta_paid,
      }));
      await updateSessionPayments(sessionId, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !session) {
    return <div className="p-8 flex items-center gap-3 text-sm text-muted-foreground"><LoadingSpinner size="sm" /> Carregando sessão...</div>;
  }

  if (!sessionId) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-sm text-muted-foreground">Forneça ?id= na URL para editar.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/history')}>Voltar</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-sm text-muted-foreground">Sessão não encontrada.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/history')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Sessão #{session.id} • {new Date(session.date).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/history')}>Voltar</Button>
          <Button onClick={handleSave} disabled={!dirty || saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm border border-destructive/30 bg-destructive/10 text-destructive rounded">{error}</div>
      )}
      {success && (
        <div className="p-3 text-sm border border-green-500/30 bg-green-500/10 text-green-600 rounded">Salvo!</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Jogadores</CardTitle>
          <CardDescription>Marque/Desmarque e salve em lote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4 font-medium">Jogador</th>
                  <th className="py-2 pr-4 font-medium">Buy-in</th>
                  <th className="py-2 pr-4 font-medium">Cash-out</th>
                  <th className="py-2 pr-4 font-medium">Resultado</th>
                  <th className="py-2 pr-4 font-medium">Sessão Paga</th>
                  <th className="py-2 pr-4 font-medium">Janta Paga</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const totalBuyin = p.totalBuyin ?? p.buyin;
                  const result = p.cashout - totalBuyin;
                  const positive = result >= 0;
                  return (
                    <tr key={p.id ?? p.name} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">{p.name}</td>
                      <td className="py-2 pr-4">{formatCurrency(totalBuyin)}</td>
                      <td className="py-2 pr-4">{formatCurrency(p.cashout)}</td>
                      <td className={`py-2 pr-4 font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>{positive ? '+' : ''}{formatCurrency(result)}</td>
                      <td className="py-2 pr-4">
                        <input
                          type="checkbox"
                          checked={!!p.session_paid}
                          onChange={() => handleToggle(i, 'session_paid')}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="checkbox"
                          checked={!!p.janta_paid}
                          onChange={() => handleToggle(i, 'janta_paid')}
                          className="w-4 h-4"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
