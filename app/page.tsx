'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, DollarSign, BarChart, Bot as LucideBot, Mail, Smartphone, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <span className="text-lg font-semibold text-muted-foreground animate-pulse">Carregando...</span>
          <div className="">
            {/* Refactored loading spinner */}
            <div className="animate-spin rounded-full border-2 border-border border-t-primary bg-white/30 backdrop-blur-md shadow-lg h-12 w-12 transition-all duration-300" aria-label="Carregando" role="status" />
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const plans = [
    {
      name: 'Free',
      id: 'free',
      price: 'Gratuito',
      priceDetail: 'Para sempre',
      description: 'Perfeito para começar e testar o sistema',
      sessions: '1 sessão por mês',
      features: [
        'Até 1 sessão por mês',
        'Controle básico de buy-ins e cash-outs',
        'Rankings e estatísticas',
        'Suporte a temas claro e escuro',
      ],
      highlighted: false,
      cta: 'Começar gratuitamente',
    },
    {
      name: 'Pro',
      id: 'pro',
      price: 'R$ 29',
      priceDetail: 'por mês',
      description: 'Ideal para grupos regulares de poker',
      sessions: '10 sessões por mês',
      features: [
        'Até 10 sessões por mês',
        'Controle completo de transações',
        'Sistema de convites e aprovações',
        'Gráficos e insights avançados',
        'Histórico completo de partidas',
        'Suporte prioritário',
      ],
      highlighted: true,
      cta: 'Começar com Pro',
    },
    {
      name: 'Premium',
      id: 'premium',
      price: 'R$ 79',
      priceDetail: 'por mês',
      description: 'Para clubes profissionais e competitivos',
      sessions: 'Sessões ilimitadas',
      features: [
        'Sessões ilimitadas',
        'Todos os recursos do plano Pro',
        '🤖 PokerBot inteligente com análise estratégica',
        'Recomendações de pagamentos otimizadas',
        'Insights de performance personalizados',
        'Análise de tendências e padrões',
        'Suporte premium dedicado',
      ],
      highlighted: false,
      cta: 'Começar com Premium',
    },
  ];

  return (
  <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-surface/10 to-accent/5 text-page-foreground">
      {/* Header */}
  <div className="sticky top-0 z-50 border-b border-border bg-gradient-to-r from-primary/20 via-surface/80 to-accent/20 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-tight text-foreground">🎯 Poker Manager</div>
          <div className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Login
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              Começar agora
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
  <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/5 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            Sistema completo de gestão de poker
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Gerencie suas sessões de poker{' '}
            <span className="text-primary">com inteligência</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Controle financeiro, rankings automáticos e análises estratégicas com PokerBot.
            Tudo em uma plataforma moderna e responsiva.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Começar gratuitamente
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
  <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Escolha o plano ideal para você
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece gratuitamente e evolua conforme suas necessidades
          </p>
        </div>

  <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border border-border shadow-lg bg-gradient-to-br from-surface/60 via-white/80 to-accent/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${plan.highlighted ? 'ring-2 ring-primary/30' : ''}`}
            >
              {/* Frase "Mais popular" dentro do card, responsiva */}
              {plan.highlighted && (
                <div className="flex w-full justify-center">
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg absolute left-1/2 -translate-x-1/2 -top-6 sm:static sm:translate-x-0 sm:top-0">
                    Mais popular
                  </span>
                </div>
              )}

              <CardHeader className="space-y-4 pb-8">
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.priceDetail}</span>
                </div>
                <div className="text-sm font-medium text-primary">{plan.sessions}</div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => {
                    let icon = <Check className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('buy-ins')) icon = <DollarSign className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('Rankings')) icon = <BarChart className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('PokerBot')) icon = <LucideBot className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('convites')) icon = <Mail className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('performance')) icon = <BarChart className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('tendências')) icon = <BarChart className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('temas')) icon = <Palette className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    if (feature.includes('sessões')) icon = <Smartphone className="mt-0.5 h-5 w-5 flex-none text-primary" />;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        {icon}
                        <span className="text-sm text-foreground/90">{feature.replace('🤖 ', '').replace('📊 ', '').replace('💰 ', '').replace('✉️ ', '').replace('📱 ', '').replace('🎨 ', '')}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link 
                  href={`/register?plan=${plan.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
                >
                  {plan.cta}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
  <div className="border-t border-border bg-gradient-to-br from-primary/10 via-surface/30 to-accent/10 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Recursos que fazem a diferença
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <DollarSign className="h-8 w-8 text-primary mx-auto" />,
                title: 'Controle financeiro completo',
                description:
                  'Acompanhe buy-ins, cash-outs e balanços de cada jogador com precisão.',
              },
              {
                icon: <BarChart className="h-8 w-8 text-primary mx-auto" />,
                title: 'Rankings automáticos',
                description:
                  'Visualize estatísticas e gráficos de performance atualizados em tempo real.',
              },
              {
                icon: <LucideBot className="h-8 w-8 text-primary mx-auto" />,
                title: 'PokerBot inteligente',
                description:
                  'Análises estratégicas e recomendações personalizadas para otimizar seus resultados.',
              },
              {
                icon: <Mail className="h-8 w-8 text-primary mx-auto" />,
                title: 'Sistema de convites',
                description:
                  'Convide jogadores por email com aprovação automática ou manual.',
              },
              {
                icon: <Smartphone className="h-8 w-8 text-primary mx-auto" />,
                title: 'Design responsivo',
                description:
                  'Interface moderna que funciona perfeitamente em celulares, tablets e desktop.',
              },
              {
                icon: <Palette className="h-8 w-8 text-primary mx-auto" />,
                title: 'Temas personalizáveis',
                description:
                  'Escolha entre modo claro e escuro para melhor conforto visual.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-gradient-to-br from-surface/60 via-white/80 to-accent/10 p-6 transition-all hover:shadow-md"
              >
                <div className="flex justify-center">{feature.icon}</div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
  <div className="px-6 py-20 bg-gradient-to-br from-primary/10 via-surface/20 to-accent/10">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Crie sua conta gratuitamente e comece a organizar suas sessões de poker hoje mesmo.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register?plan=free" className={cn(buttonVariants({ size: "lg" }))}>
              Começar gratuitamente
            </Link>
            <Link href="/register?plan=premium" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Experimentar Premium
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
  <div className="border-t border-border bg-gradient-to-r from-primary/10 via-surface/30 to-accent/10 px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>© 2024 Poker Manager. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}

