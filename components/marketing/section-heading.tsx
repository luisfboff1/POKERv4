import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';
type SectionHeadingProps = {
  eyebrow?: string;
  title: string | ReactNode;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'default' | 'inverted';
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'default',
  className
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl text-left';

  const toneStyles = {
    eyebrow:
      tone === 'inverted'
        ? 'border-white/20 bg-white/10 text-white'
        : 'border-primary/20 bg-primary/10 text-primary',
    title: tone === 'inverted' ? 'text-white' : 'text-foreground',
    description: tone === 'inverted' ? 'text-white/80' : 'text-muted-foreground'
  };

  return (
    <div className={cn('space-y-4', alignment, className)}>
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide',
            toneStyles.eyebrow
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2 className={cn('text-balance text-3xl font-bold tracking-tight sm:text-4xl', toneStyles.title)}>
        {title}
      </h2>
      {description && (
        <p className={cn('text-base sm:text-lg', toneStyles.description)}>
          {description}
        </p>
      )}
    </div>
  );
}
