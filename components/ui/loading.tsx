import { cn } from '@/lib/utils';
// DaisyUI/shadcn/ui glassmorphism, animation, and modern design

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-border border-t-primary',
        'bg-white/30 backdrop-blur-md shadow-lg transition-all duration-300',
        sizeClasses[size],
        className
      )}
      aria-label="Carregando"
      role="status"
    />
  );
}

interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text = 'Carregando...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <LoadingSpinner />
      <span className="text-muted-foreground animate-pulse" aria-live="polite">{text}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 bg-white/30 backdrop-blur-md shadow-lg py-12 text-center transition-all duration-300">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/60" />}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground drop-shadow-sm">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({ 
  title = 'Erro ao carregar dados', 
  message, 
  retry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/20 bg-white/30 backdrop-blur-md shadow-lg py-12 text-center transition-all duration-300">
      <div className="rounded-full bg-destructive/10 p-3">
        <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground drop-shadow-sm">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {retry && (
        <button 
          onClick={retry}
          className="mt-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}