import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  LineChart,
  MonitorSmartphone,
  ShieldCheck,
  Users,
  Wallet
} from 'lucide-react';

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  sessionsLabel: string;
  features: string[];
  cta: string;
  highlight?: {
    label: string;
  };
};

export type MarketingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Gratuito',
    priceSuffix: 'para sempre',
    description: 'Perfeito para começar e testar o sistema',
    sessionsLabel: '1 sessão por mês',
    features: [
      'Até 1 sessão por mês',
      'Controle básico de buy-ins e cash-outs',
      'Rankings e estatísticas essenciais',
      'Suporte a temas claro e escuro'
    ],
    cta: 'Começar gratuitamente'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 29',
    priceSuffix: 'por mês',
    description: 'Ideal para grupos regulares de poker',
    sessionsLabel: '10 sessões por mês',
    features: [
      'Até 10 sessões por mês',
      'Controle completo de transações',
      'Sistema de convites e aprovações',
      'Gráficos e insights avançados',
      'Histórico completo de partidas',
      'Suporte prioritário'
    ],
    cta: 'Começar com Pro',
    highlight: {
      label: 'Mais popular'
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 79',
    priceSuffix: 'por mês',
    description: 'Para clubes profissionais e competitivos',
    sessionsLabel: 'Sessões ilimitadas',
    features: [
      'Sessões ilimitadas',
      'Todos os recursos do plano Pro',
      'PokerBot inteligente com análise estratégica',
      'Recomendações de pagamentos otimizadas',
      'Insights de performance personalizados',
      'Suporte premium dedicado'
    ],
    cta: 'Assinar Premium'
  }
];

export const marketingFeatures: MarketingFeature[] = [
  {
    icon: Wallet,
    title: 'Controle financeiro completo',
    description: 'Acompanhe buy-ins, cash-outs e balanços de cada jogador com precisão e sem planilhas.',
    accent: 'from-primary/30 via-primary/10 to-transparent'
  },
  {
    icon: LineChart,
    title: 'Rankings automáticos',
    description: 'Visualize estatísticas e gráficos de performance atualizados em tempo real.',
    accent: 'from-sky-400/30 via-primary/10 to-transparent'
  },
  {
    icon: Bot,
    title: 'PokerBot inteligente',
    description: 'Análises estratégicas e recomendações personalizadas para otimizar seus resultados.',
    accent: 'from-violet-400/30 via-primary/10 to-transparent'
  },
  {
    icon: Users,
    title: 'Sistema de convites completo',
    description: 'Convide jogadores por e-mail com aprovação automática ou manual e controle de permissões.',
    accent: 'from-emerald-400/30 via-primary/10 to-transparent'
  },
  {
    icon: MonitorSmartphone,
    title: 'Experiência responsiva',
    description: 'Interface moderna que funciona perfeitamente em celulares, tablets e desktop.',
    accent: 'from-amber-300/25 via-primary/10 to-transparent'
  },
  {
    icon: ShieldCheck,
    title: 'Segurança avançada',
    description: 'Autenticação segura, backups e criptografia para manter dados protegidos.',
    accent: 'from-rose-400/30 via-primary/10 to-transparent'
  }
];
