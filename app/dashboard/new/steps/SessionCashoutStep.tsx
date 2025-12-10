import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, Search, ArrowUpDown } from 'lucide-react';
import type { LiveSession, LivePlayer } from '@/lib/types';
import type { UpdateLivePlayerField } from './types';
import type { SessionStep } from './SessionCreateStep';
import { formatCurrency } from '@/lib/format';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface SessionCashoutStepProps {
  currentSession: LiveSession;
  totals: { totalBuyin: number; totalCashout: number; totalJanta: number };
  isBalanced: boolean;
  updatePlayerField: UpdateLivePlayerField;
  setStep: (step: SessionStep) => void;
  calculateRecommendations: () => void;
}

// Component for cash-out input to avoid hook issues in cell renderer
const CashoutInput: React.FC<{
  player: LivePlayer;
  updatePlayerField: UpdateLivePlayerField;
}> = ({ player, updatePlayerField }) => {
  const [localValue, setLocalValue] = useState(player.cashout?.toString() || '');
  
  useEffect(() => {
    setLocalValue(player.cashout?.toString() || '');
  }, [player.cashout]);

  return (
    <Input
      type="number"
      placeholder="0"
      value={localValue}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const value = Number(localValue) || 0;
        updatePlayerField(player.id, 'cashout', value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const value = Number(localValue) || 0;
          updatePlayerField(player.id, 'cashout', value);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-32"
    />
  );
};

export const SessionCashoutStep: React.FC<SessionCashoutStepProps> = ({
  currentSession,
  totals,
  isBalanced,
  updatePlayerField,
  setStep,
  calculateRecommendations
}) => {
  // Mobile search and sort state
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [mobileSortAlphabetically, setMobileSortAlphabetically] = useState(false);

  // Filtered and sorted players for mobile view
  const filteredAndSortedPlayers = useMemo(() => {
    let players = [...currentSession.players];
    
    // Apply search filter
    if (mobileSearchTerm.trim()) {
      const searchLower = mobileSearchTerm.toLowerCase();
      players = players.filter(player => 
        player.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply alphabetical sort
    if (mobileSortAlphabetically) {
      players.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
    
    return players;
  }, [currentSession.players, mobileSearchTerm, mobileSortAlphabetically]);
  
  // Mobile Player Card Component
  const MobileCashoutCard: React.FC<{ player: LivePlayer }> = ({ player }) => {
    const [localValue, setLocalValue] = useState(player.cashout?.toString() || '');
    
    useEffect(() => {
      setLocalValue(player.cashout?.toString() || '');
    }, [player.cashout]);

    const result = player.cashout - player.totalBuyin;
    const positive = result >= 0;

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header: Name and Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{player.name}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Buy-in: {formatCurrency(player.totalBuyin)}</span>
              <span>•</span>
              <span>Janta: {formatCurrency(player.janta)}</span>
            </div>
          </div>

          {/* Cashout Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cash-out (R$)</label>
            <Input
              type="number"
              placeholder="0"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={() => {
                const value = Number(localValue) || 0;
                updatePlayerField(player.id, 'cashout', value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = Number(localValue) || 0;
                  updatePlayerField(player.id, 'cashout', value);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="h-11 text-base"
            />
          </div>

          {/* Result */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            positive ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            <span className="text-sm font-medium">Resultado</span>
            <div className={cn(
              "text-lg font-bold",
              positive ? "text-green-600" : "text-red-600"
            )}>
              {positive ? '+' : ''}{formatCurrency(result)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Define columns for cashout table
  const columns: ColumnDef<LivePlayer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jogador" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue("name")}</p>
          <p className="text-sm text-muted-foreground">
            Buy-in: {formatCurrency(row.original.totalBuyin)} • Janta: {formatCurrency(row.original.janta)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "cashout",
      header: "Cash-out (R$)",
      cell: ({ row }) => {
        const player = row.original;
        return <CashoutInput player={player} updatePlayerField={updatePlayerField} />;
      },
    },
    {
      id: "result",
      header: "Resultado",
      cell: ({ row }) => {
        const player = row.original;
        const result = player.cashout - player.totalBuyin;
        const positive = result >= 0;
        return (
          <div className={`text-lg font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? '+' : ''}{formatCurrency(result)}
          </div>
        );
      },
    },
  ];

  return (
  <div className="space-y-4 md:space-y-6">
    <div className="space-y-1">
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Finalizar Sessão</h1>
      <p className="text-xs md:text-sm text-muted-foreground">Registre quanto cada jogador saiu em fichas</p>
    </div>

    {/* Mobile View - Card List */}
    <div className="md:hidden space-y-4">
      {/* Mobile Search and Sort Controls */}
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar jogador..."
              value={mobileSearchTerm}
              onChange={(e) => setMobileSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant={mobileSortAlphabetically ? "default" : "outline"}
            size="icon"
            onClick={() => setMobileSortAlphabetically(!mobileSortAlphabetically)}
            title={mobileSortAlphabetically ? "Ordem original" : "Ordenar A-Z"}
            className="h-10 w-10 flex-shrink-0"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Cash-out dos Jogadores</h2>
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedPlayers.length} {filteredAndSortedPlayers.length === 1 ? 'jogador' : 'jogadores'}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredAndSortedPlayers.length > 0 ? (
          filteredAndSortedPlayers.map((player) => (
            <MobileCashoutCard key={player.id} player={player} />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum jogador encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-lg font-bold">{formatCurrency(totals.totalBuyin)}</div>
              <div className="text-xs text-muted-foreground">Buy-in</div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-lg font-bold">{formatCurrency(totals.totalCashout)}</div>
              <div className="text-xs text-muted-foreground">Cash-out</div>
            </div>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg text-center",
            isBalanced ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            <div className={cn(
              "flex items-center justify-center gap-2 font-bold",
              isBalanced ? "text-green-600" : "text-red-600"
            )}>
              {isBalanced ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Balanceado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Diferença: {formatCurrency(Math.abs(totals.totalBuyin - totals.totalCashout))}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => {
            calculateRecommendations();
            setStep('transfers');
          }}
          disabled={!isBalanced}
          className="w-full h-11"
          size="lg"
        >
          Continuar para Transferências
        </Button>
        <Button variant="outline" onClick={() => setStep('active')} className="w-full h-11">
          Voltar
        </Button>
      </div>
    </div>

    {/* Desktop View - DataTable */}
    <Card className="hidden md:block">
      <CardHeader>
        <CardTitle>Cash-out dos Jogadores</CardTitle>
        <CardDescription>Digite quanto cada jogador terminou em fichas</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={currentSession.players}
          searchKey="name"
          searchPlaceholder="Filtrar por jogador..."
          enableColumnVisibility={true}
          enableSorting={true}
          enableFiltering={true}
        />
        
        <div className="pt-4 mt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold">{formatCurrency(totals.totalBuyin)}</div>
              <div className="text-sm text-muted-foreground">Total Buy-in</div>
            </div>
            <div>
              <div className="text-xl font-bold">{formatCurrency(totals.totalCashout)}</div>
              <div className="text-sm text-muted-foreground">Total Cash-out</div>
            </div>
            <div>
              <div className={`text-xl font-bold flex items-center justify-center gap-2 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {isBalanced ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Balanceado
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    Diferença: {formatCurrency(Math.abs(totals.totalBuyin - totals.totalCashout))}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            onClick={() => {
              calculateRecommendations();
              setStep('transfers');
            }}
            disabled={!isBalanced}
          >
            Continuar para Transferências
          </Button>
          <Button variant="ghost" onClick={() => setStep('active')}>Voltar</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
};