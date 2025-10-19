// Utilitário para Google Analytics
// Use para rastrear eventos customizados

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

export const GA_TRACKING_ID = 'G-RZHKVNR9XB';

// Função para rastrear eventos personalizados
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Eventos específicos do sistema de poker
export const trackPokerEvent = {
  // Login/Registro
  login: () => trackEvent('login', 'authentication'),
  register: () => trackEvent('register', 'authentication'),
  logout: () => trackEvent('logout', 'authentication'),

  // Sessões
  createSession: () => trackEvent('create_session', 'poker_session'),
  approveSession: () => trackEvent('approve_session', 'poker_session'),
  deleteSession: () => trackEvent('delete_session', 'poker_session'),

  // Jogadores
  addPlayer: () => trackEvent('add_player', 'player_management'),
  invitePlayer: () => trackEvent('invite_player', 'player_management'),

  // Navegação
  viewRanking: () => trackEvent('view_ranking', 'navigation'),
  viewHistory: () => trackEvent('view_history', 'navigation'),
  viewDashboard: () => trackEvent('view_dashboard', 'navigation'),
};

// Função para rastrear visualizações de página personalizadas
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_title: title || document.title,
      page_location: url,
    });
  }
};