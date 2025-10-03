'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
// ...existing code...
import { Button } from '@/components/ui/button';
import { PokerBackdrop } from '@/components/marketing/poker-backdrop';
import { SectionHeading } from '@/components/marketing/section-heading';
import { PricingCard } from '@/components/marketing/pricing-card';
import { FeatureCard } from '@/components/marketing/feature-card';
import { marketingFeatures, pricingPlans } from '@/lib/marketing-content';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }



  return (
    <div className="relative min-h-screen bg-page text-page-foreground">
      {/* Poker Background */}
  {/* Poker Background com ajuste de contraste para light/dark */}
  <PokerBackdrop variant="felt" className="z-0" />
  <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-[#2c4d3b]/60 via-[#3a6b4d]/40 to-[#e6f4ea]/80 dark:from-[#1a2a1f]/80 dark:to-black/0" />

      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-tight text-foreground">Poker Manager</div>
          <div className="flex items-center gap-4 text-sm">
            {/* <ThemeToggle /> */}
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Começar agora</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
  <div className="relative z-10 overflow-hidden px-6 py-40">
        <div className="mx-auto max-w-4xl text-center">
          <SectionHeading
            eyebrow="Sistema completo de gestão de poker"
            title={<span className="inline-block text-white text-5xl font-extrabold tracking-tight drop-shadow-lg md:text-6xl animate-fade-in-up">Gerencie suas sessões de poker com <span className="text-primary neon-poker">inteligência</span></span>}
            description="Gestão financeira, rankings automáticos e análises estratégicas para clubes e grupos de poker. Plataforma moderna, responsiva e segura."
            align="center"
          />
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button asChild size="lg" variant="outline">
                    <Link href="/register">Começar gratuitamente</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">Já tenho conta</Link>
                  </Button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <SectionHeading
          title="Escolha o plano ideal para você"
          description="Comece gratuitamente e evolua conforme suas necessidades"
          align="center"
        />
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 border-t border-border bg-surface/50 px-6 py-20">
        <SectionHeading
          title="Recursos que fazem a diferença"
          align="center"
        />
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {marketingFeatures.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl bg-linear-to-br from-primary/15 via-primary/10 to-primary/5 p-12 text-center shadow-lg">
          <SectionHeading
            title="Pronto para começar?"
            description="Crie sua conta gratuitamente e comece a organizar suas sessões de poker hoje mesmo."
            align="center"
          />
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button asChild size="lg" variant="outline">
                    <Link href="/register?plan=free">Começar gratuitamente</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/register?plan=premium">Experimentar Premium</Link>
                  </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>© 2024 Poker Manager. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}

