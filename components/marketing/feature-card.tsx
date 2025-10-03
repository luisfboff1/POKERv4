import { cn } from '@/lib/utils';
import type { MarketingFeature } from '@/lib/marketing-content';

interface FeatureCardProps {
  feature: MarketingFeature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-6 shadow-(--shadow-soft) transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          'bg-linear-to-br',
          feature.accent
        )}
      />
      <div className="relative flex h-full flex-col gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>
      </div>
    </div>
  );
}
