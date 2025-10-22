'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Check,
  DollarSign,
  BarChart,
  Bot as LucideBot,
  Mail,
  Smartphone,
  Palette,
  Zap,
  Shield,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  Spade,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';
import PlasmaWrapper from '@/components/PlasmaWrapper';
import { Analytics } from '@vercel/analytics/next';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="animate-pulse text-lg font-semibold text-muted-foreground">
            Carregando...
          </span>
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
      badge: null,
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
      badge: 'Mais popular',
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
        'PokerBot inteligente com análise estratégica',
        'Recomendações de pagamentos otimizadas',
        'Insights de performance personalizados',
        'Análise de tendências e padrões',
        'Suporte premium dedicado',
      ],
      highlighted: false,
      badge: 'Melhor custo-benefício',
      cta: 'Começar com Premium',
    },
  ];

  const features = [
    {
      icon: <DollarSign className="mx-auto h-8 w-8 text-primary" />,
      title: 'Controle financeiro completo',
      description: 'Acompanhe buy-ins, cash-outs e balanços de cada jogador com precisão.',
    },
    {
      icon: <BarChart className="mx-auto h-8 w-8 text-primary" />,
      title: 'Rankings automáticos',
      description: 'Visualize estatísticas e gráficos de performance atualizados em tempo real.',
    },
    {
      icon: <LucideBot className="mx-auto h-8 w-8 text-primary" />,
      title: 'PokerBot inteligente',
      description: 'Análises estratégicas e recomendações personalizadas para otimizar seus resultados.',
    },
    {
      icon: <Mail className="mx-auto h-8 w-8 text-primary" />,
      title: 'Sistema de convites',
      description: 'Convide jogadores por email com aprovação automática ou manual.',
    },
    {
      icon: <Smartphone className="mx-auto h-8 w-8 text-primary" />,
      title: 'Design responsivo',
      description: 'Interface moderna que funciona perfeitamente em celulares, tablets e desktop.',
    },
    {
      icon: <Palette className="mx-auto h-8 w-8 text-primary" />,
      title: 'Temas personalizáveis',
      description: 'Escolha entre modo claro e escuro para melhor conforto visual.',
    },
  ];

  return (
    <>
      <Analytics />
      <div className="relative min-h-screen bg-background text-foreground">
        {/* Plasma Background - Global para toda a página */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <PlasmaWrapper
            color="#3b82f6"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.15}
            mouseInteractive={false}
          />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className={cn(designTokens.container.lg, 'flex items-center justify-between px-6 py-4')}>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                <Spade className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">Poker Manager</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                Login
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'sm' }), designTokens.button.glow)}
              >
                Começar agora
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative">
          {/* Hero Content */}
          <div className={cn(designTokens.container.lg, designTokens.spacing.section, 'relative z-10 px-6')}>
            <div className="mx-auto max-w-4xl text-center">
              <motion.div {...fadeInUp}>
                <Badge variant="default" className="mb-6 px-4 py-1.5 text-sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sistema completo de gestão de poker
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn(designTokens.typography.hero, 'mb-6')}
              >
                Gerencie suas sessões de poker{' '}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  com inteligência
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(designTokens.typography.lead, 'mb-10')}
              >
                Controle financeiro, rankings automáticos e análises estratégicas com PokerBot.
                <br className="hidden sm:block" />
                Tudo em uma plataforma moderna e responsiva.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: 'lg' }), designTokens.button.glow, 'group')}
                >
                  Começar gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
                  Já tenho conta
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>100% Seguro</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Setup em 2 minutos</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>1000+ sessões gerenciadas</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={cn(designTokens.container.lg, designTokens.spacing.section, 'relative z-10 px-6')}>
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Planos e Preços
            </Badge>
            <h2 className={cn(designTokens.typography.h2, 'mb-4')}>
              Escolha o plano ideal para você
            </h2>
            <p className={cn(designTokens.typography.body, 'text-muted-foreground')}>
              Comece gratuitamente e evolua conforme suas necessidades
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    'relative flex flex-col',
                    designTokens.card.base,
                    designTokens.card.hover,
                    designTokens.card.gradient,
                    plan.highlighted && 'ring-2 ring-primary/50 shadow-xl'
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge variant="default" className="shadow-lg">
                        <Star className="mr-1 h-3 w-3" />
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={cn(designTokens.spacing.element, 'space-y-4')}>
                    <div>
                      <CardTitle className={designTokens.typography.h3}>{plan.name}</CardTitle>
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.priceDetail}</span>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {plan.sessions}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 flex-none text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/register?plan=${plan.id}`}
                      className={cn(
                        buttonVariants({
                          variant: plan.highlighted ? 'default' : 'outline',
                          size: 'lg',
                        }),
                        'w-full',
                        plan.highlighted && designTokens.button.glow
                      )}
                    >
                      {plan.cta}
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 relative z-10">
          <div className={cn(designTokens.container.lg, designTokens.spacing.section, 'px-6')}>
            <div className="text-center">
              <Badge variant="outline" className="mb-4">
                Recursos
              </Badge>
              <h2 className={cn(designTokens.typography.h2, 'mb-4')}>
                Recursos que fazem a diferença
              </h2>
              <p className={cn(designTokens.typography.body, 'text-muted-foreground')}>
                Tudo que você precisa para gerenciar suas sessões de poker
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={cn(designTokens.card.base, designTokens.card.hover, 'h-full')}>
                    <CardContent className={designTokens.spacing.element}>
                      <div className="flex justify-center">{feature.icon}</div>
                      <h3 className={cn(designTokens.typography.h3, 'mt-4 text-center text-lg')}>
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-center text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={cn(designTokens.container.lg, designTokens.spacing.section, 'relative z-10 px-6')}>
          <Card className={cn(designTokens.card.base, 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent')}>
            <CardContent className={cn(designTokens.spacing.container, 'text-center')}>
              <Badge variant="default" className="mb-6">
                <Sparkles className="mr-2 h-4 w-4" />
                Pronto para começar?
              </Badge>
              
              <h2 className={cn(designTokens.typography.h2, 'mb-4')}>
                Comece a organizar suas sessões hoje
              </h2>
              
              <p className={cn(designTokens.typography.body, 'mb-8 text-muted-foreground')}>
                Crie sua conta gratuitamente e experimente todos os recursos do Poker Manager
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register?plan=free"
                  className={cn(buttonVariants({ size: 'lg' }), designTokens.button.glow)}
                >
                  Começar gratuitamente
                </Link>
                <Link href="/register?plan=premium" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
                  Experimentar Premium
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/40 bg-muted/30">
          <div className={cn(designTokens.container.lg, 'px-6 py-8')}>
            <div className="text-center text-sm text-muted-foreground">
              <p>© 2025 Poker Manager. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
