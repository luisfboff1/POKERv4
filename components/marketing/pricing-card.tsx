import Link from 'next/link';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import type { PricingPlan } from '@/lib/marketing-content';

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  const isHighlighted = Boolean(plan.highlight);

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col overflow-hidden border border-border/70 bg-card/95 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover',
        isHighlighted && 'border-primary/30 shadow-glow'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-linear-to-br from-primary/12 via-primary/5 to-transparent" />
      </div>

      {isHighlighted && (
        <div className="absolute inset-x-0 flex justify-center pt-6">
          <Badge className="shadow-glow" variant="default">
            {plan.highlight?.label}
          </Badge>
        </div>
      )}

      <CardHeader className={cn('relative space-y-5 pb-8', isHighlighted ? 'pt-16' : 'pt-12')}>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
          <CardDescription className="text-base">{plan.description}</CardDescription>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-4xl font-bold text-foreground">{plan.price}</span>
          <span className="text-sm text-muted-foreground">{plan.priceSuffix}</span>
        </div>

        <div className="text-sm font-medium text-primary">{plan.sessionsLabel}</div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col justify-between space-y-6 pb-10">
        <ul className="space-y-3 text-sm">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-left">
              <Check className="mt-0.5 h-5 w-5 flex-none text-primary" />
              <span className="text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full"
          >
            <Link href={`/register?plan=${plan.id}`}>{plan.cta}</Link>
          </Button>
      </CardContent>
    </Card>
  );
}
