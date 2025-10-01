import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Filter, Search } from 'lucide-react';
import { ReactNode } from 'react';

export interface SessionFiltersState {
  search: string;
  status: 'all' | 'pending' | 'approved' | 'closed';
  dateFrom: string;
  dateTo: string;
}

interface SessionFiltersProps {
  value: SessionFiltersState;
  onChange(next: SessionFiltersState): void;
  extraHeader?: ReactNode;
}

export function SessionFilters({ value, onChange, extraHeader }: SessionFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
        {extraHeader}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar por local</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do local..."
                value={value.search}
                onChange={(e) => onChange({ ...value, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-surface text-foreground"
              value={value.status}
              onChange={(e) => onChange({ ...value, status: e.target.value as SessionFiltersState['status'] })}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovada</option>
              <option value="closed">Fechada</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data inicial</label>
            <Input
              type="date"
              value={value.dateFrom}
              onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
            />
          </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data final</label>
              <Input
                type="date"
                value={value.dateTo}
                onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
              />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
