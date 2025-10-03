import { cn } from '@/lib/utils';

type PokerBackdropProps = {
  variant?: 'felt' | 'noir';
  className?: string;
};

const variantBackground: Record<NonNullable<PokerBackdropProps['variant']>, string> = {
  felt: 'from-[#1e4631] via-[#153225] to-[#0c1f17]',
  noir: 'from-[#080a14] via-[#05060f] to-[#070813]',
};

const overlayGradients: Record<NonNullable<PokerBackdropProps['variant']>, string> = {
  felt: 'bg-[radial-gradient(circle_at_20%_22%,rgba(52,211,153,0.22),transparent_55%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(circle_at_30%_85%,rgba(14,165,233,0.16),transparent_62%)]',
  noir: 'bg-[radial-gradient(circle_at_15%_20%,rgba(148,163,184,0.18),transparent_55%),radial-gradient(circle_at_75%_30%,rgba(79,70,229,0.18),transparent_60%),radial-gradient(circle_at_40%_82%,rgba(236,72,153,0.16),transparent_62%)]',
};

const chips = [
  {
    key: 'chip-1',
    wrapper: 'top-12 left-[6%] h-28 w-28 -rotate-12',
    gradient: 'from-rose-500/70 via-rose-500/55 to-rose-600/45',
  },
  {
    key: 'chip-2',
    wrapper: 'bottom-[-3rem] right-[10%] h-32 w-32 rotate-6',
    gradient: 'from-sky-500/65 via-indigo-500/50 to-indigo-600/40',
  },
  {
    key: 'chip-3',
    wrapper: 'bottom-[-2rem] left-[32%] h-24 w-24 rotate-2',
    gradient: 'from-emerald-500/65 via-emerald-400/50 to-emerald-600/38',
  },
];

const suits = [
  {
    key: 'spade',
    symbol: '♠',
    className: 'top-16 right-[18%] text-[96px] text-white/18 rotate-[10deg] dark:text-white/12',
  },
  {
    key: 'heart',
    symbol: '♥',
    className: 'bottom-14 left-[12%] text-[88px] text-rose-400/22 -rotate-[8deg] dark:text-rose-200/18',
  },
  {
    key: 'club',
    symbol: '♣',
    className: 'top-8 left-[38%] text-[76px] text-emerald-400/20 rotate-[4deg] dark:text-emerald-200/16',
  },
  {
    key: 'diamond',
    symbol: '♦',
    className: 'bottom-20 right-[32%] text-[84px] text-rose-300/20 rotate-[14deg] dark:text-rose-300/16',
  },
];

export function PokerBackdrop({ variant = 'felt', className }: PokerBackdropProps) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-[0.55] dark:opacity-[0.92] transition-opacity duration-500',
          variantBackground[variant]
        )}
      />

      <div
        className={cn(
          'absolute inset-0 mix-blend-lighten opacity-[0.4] dark:opacity-[0.55] transition-opacity duration-500',
          overlayGradients[variant]
        )}
      />

      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.16]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10px 10px, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 1.3px, transparent 1.6px), radial-gradient(circle at 40px 40px, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1.3px, transparent 1.6px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30 dark:via-black/40" />

      {chips.map((chip) => (
        <div
          key={chip.key}
          className={cn('absolute rounded-full opacity-60 dark:opacity-75 blur-[0.4px]', chip.wrapper)}
        >
          <div className={cn('absolute inset-0 rounded-full bg-gradient-to-br', chip.gradient)} />
          <div className="absolute inset-0 rounded-full opacity-45 [background:repeating-conic-gradient(from_0deg,rgba(255,255,255,0.85)_0deg_18deg,transparent_18deg_36deg)]" />
          <div className="absolute inset-[22%] rounded-full border border-white/45" />
          <div className="absolute inset-[38%] rounded-full bg-slate-900/30" />
        </div>
      ))}

      {suits.map(({ key, symbol, className: suitClass }) => (
        <span key={key} className={cn('absolute font-serif font-black tracking-tight', suitClass)}>
          {symbol}
        </span>
      ))}
    </div>
  );
}
