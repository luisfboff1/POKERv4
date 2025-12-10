'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { RankingPeriod, CreateRankingPeriodPayload } from '@/lib/types';

interface PeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period?: RankingPeriod | null;
  onSave: (data: CreateRankingPeriodPayload) => Promise<void>;
}

export function PeriodDialog({ open, onOpenChange, period, onSave }: PeriodDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRankingPeriodPayload>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  // Reset form when period prop changes
  useEffect(() => {
    if (period) {
      setFormData({
        name: period.name,
        description: period.description || '',
        start_date: period.start_date,
        end_date: period.end_date,
        is_active: period.is_active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        is_active: true,
      });
    }
  }, [period]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate < startDate) {
        toast({
          title: 'Erro',
          description: 'A data final deve ser posterior à data inicial',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      await onSave(formData);
      
      toast({
        title: 'Sucesso',
        description: period ? 'Período atualizado com sucesso' : 'Período criado com sucesso',
      });

      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving period:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar período',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {period ? 'Editar período' : 'Novo período de ranking'}
          </DialogTitle>
          <DialogDescription>
            Defina um período personalizado para calcular rankings históricos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do período *</Label>
            <Input
              id="name"
              placeholder="Ex: 1º Semestre 2024, Novembro 2024"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Descrição do período"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data inicial *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data final *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Período ativo
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : period ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
