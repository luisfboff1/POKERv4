/**
 * Sistema de Auto-Aprovação de Sessões
 * 
 * ⚠️ DEPRECADO: Este sistema não é mais necessário!
 * O status agora é atualizado AUTOMATICAMENTE pela API quando os pagamentos são marcados.
 * Veja: app/api/sessions/[id]/payments/route.ts
 * 
 * Mantido aqui apenas para compatibilidade retroativa.
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
   * ⚠️ DEPRECADO: Status agora é atualizado automaticamente pela API
   */
  async checkAndApprove(transfers: Transfer[]): Promise<boolean> {
    console.log('ℹ️ Auto-aprovação desabilitada - status é atualizado automaticamente pela API');
    
    const allTransfersPaid = transfers.every(transfer => transfer.isPaid);
    
    // Apenas notificar mudança de status (não aprovar)
    if (this.config.onStatusChange) {
      if (allTransfersPaid) {
        this.config.onStatusChange('completed');
      } else {
        const paidCount = transfers.filter(t => t.isPaid).length;
        if (paidCount > 0) {
          this.config.onStatusChange('partial');
        } else {
          this.config.onStatusChange('pending');
        }
      }
    }
    
    return allTransfersPaid;
  }

  /**
   * ⚠️ DEPRECADO: Webhook não faz nada - API atualiza automaticamente
   */
  async onTransferUpdate(transfers: Transfer[]): Promise<void> {
    // Não faz nada - API já atualiza o status automaticamente
    console.log('ℹ️ onTransferUpdate: Status é atualizado automaticamente pela API');
    await this.checkAndApprove(transfers);
  }
}

/**
 * Factory function para criar instância de auto-aprovação para uma sessão
 * ⚠️ DEPRECADO
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
 * ⚠️ DEPRECADO: Não chama mais a API, apenas notifica status local
 */
export function useSessionAutoApproval(sessionId: number) {
  const approveSession = async (id: number) => {
    // Não faz nada - API já atualiza automaticamente
    console.log('ℹ️ approveSession: Status é atualizado automaticamente pela API ao marcar pagamentos');
  };

  const autoApproval = createSessionAutoApproval(sessionId, approveSession);
  
  return {
    onTransferUpdate: autoApproval.onTransferUpdate.bind(autoApproval),
    checkAndApprove: autoApproval.checkAndApprove.bind(autoApproval)
  };
}