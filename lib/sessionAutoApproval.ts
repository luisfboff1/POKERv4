/**
 * Sistema de Auto-Aprovação de Sessões
 * Monitora os pagamentos das transferências e aprova automaticamente
 * quando todos os pagamentos estão completos
 */

import type { Transfer } from './transferSystem';

interface AutoApprovalConfig {
  sessionId: number;
  onApprove?: (sessionId: number) => Promise<void>;
  onStatusChange?: (status: 'pending' | 'partial' | 'completed') => void;
}

export class SessionAutoApproval {
  private config: AutoApprovalConfig;
  
  constructor(config: AutoApprovalConfig) {
    this.config = config;
  }

  /**
   * Verifica se a sessão deve ser auto-aprovada baseado no status das transferências
   */
  async checkAndApprove(transfers: Transfer[]): Promise<boolean> {
    const allTransfersPaid = transfers.every(transfer => transfer.isPaid);
    
    if (allTransfersPaid) {
      console.log('🎯 Todas as transferências foram pagas! Auto-aprovando sessão...');
      
      try {
        // Aprovar a sessão automaticamente
        if (this.config.onApprove) {
          await this.config.onApprove(this.config.sessionId);
        }
        
        // Notificar mudança de status
        if (this.config.onStatusChange) {
          this.config.onStatusChange('completed');
        }
        
        return true;
      } catch (error) {
        console.error('❌ Erro na auto-aprovação:', error);
        return false;
      }
    }
    
    // Notificar status parcial se nem todos pagaram
    const paidCount = transfers.filter(t => t.isPaid).length;
    if (paidCount > 0 && this.config.onStatusChange) {
      this.config.onStatusChange('partial');
    }
    
    return false;
  }

  /**
   * Webhook para ser chamado quando transfers são atualizadas
   */
  async onTransferUpdate(transfers: Transfer[]): Promise<void> {
    await this.checkAndApprove(transfers);
  }
}

/**
 * Factory function para criar instância de auto-aprovação para uma sessão
 */
export function createSessionAutoApproval(
  sessionId: number,
  onApprove?: (sessionId: number) => Promise<void>,
  onStatusChange?: (status: 'pending' | 'partial' | 'completed') => void
): SessionAutoApproval {
  return new SessionAutoApproval({
    sessionId,
    onApprove,
    onStatusChange
  });
}

/**
 * Hook simples para integrar auto-aprovação com componentes React
 */
export function useSessionAutoApproval(sessionId: number) {
  const approveSession = async (id: number) => {
    try {
      // Integrar com a API de aprovação existente
      const response = await fetch('/api/session.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'approve',
          session_id: id
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha na auto-aprovação');
      }
      
      console.log('✅ Sessão auto-aprovada com sucesso!');
    } catch (error) {
      console.error('❌ Erro na auto-aprovação:', error);
      throw error;
    }
  };

  const autoApproval = createSessionAutoApproval(sessionId, approveSession);
  
  return {
    onTransferUpdate: autoApproval.onTransferUpdate.bind(autoApproval),
    checkAndApprove: autoApproval.checkAndApprove.bind(autoApproval)
  };
}