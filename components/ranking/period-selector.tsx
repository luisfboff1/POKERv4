'use client';

import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RankingPeriod } from '@/lib/types';

interface PeriodSelectorProps {
  periods: RankingPeriod[];
  selectedPeriod: string | null; // null = "current" (all-time)
  onPeriodChange: (periodId: string | null) => void;
  onCreatePeriod?: () => void;
  onEditPeriod?: (period: RankingPeriod) => void;
  onDeletePeriod?: (periodId: number) => void;
  isAdmin?: boolean;
}

export function PeriodSelector({
  periods,
  selectedPeriod,
  onPeriodChange,
  onCreatePeriod,
  onEditPeriod,
  onDeletePeriod,
  isAdmin = false,
}: PeriodSelectorProps) {
  const formatDateRange = (period: RankingPeriod) => {
    const start = new Date(period.start_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const end = new Date(period.end_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  const selectedPeriodData = selectedPeriod
    ? periods.find(p => p.id.toString() === selectedPeriod)
    : null;

  return (
    <div className="space-y-3 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto min-w-0">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Select value={selectedPeriod || 'current'} onValueChange={(value) => onPeriodChange(value === 'current' ? null : value)}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">
                <div className="flex flex-col">
                  <span className="font-medium">Ranking Atual</span>
                  <span className="text-xs text-muted-foreground">Todas as sessões</span>
                </div>
              </SelectItem>
              {periods.length > 0 && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Períodos históricos
                </div>
              )}
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{period.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateRange(period)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <Button
            onClick={onCreatePeriod}
            size="sm"
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo período
          </Button>
        )}
      </div>

      {/* Show period details and actions when a period is selected */}
      {selectedPeriodData && isAdmin && (
        <div className={cn(
          'flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between p-3 rounded-lg border bg-muted/50',
          'text-sm max-w-full overflow-hidden'
        )}>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedPeriodData.name}</p>
            {selectedPeriodData.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {selectedPeriodData.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditPeriod?.(selectedPeriodData)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeletePeriod?.(selectedPeriodData.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
