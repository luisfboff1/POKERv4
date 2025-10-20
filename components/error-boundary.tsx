'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you might want to send this to an error tracking service
    // Example: logErrorToService(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Algo deu errado</CardTitle>
            <CardDescription>
              Ocorreu um erro inesperado. Tente recarregar a página ou voltar para a página inicial.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Show error details in development */}
          {isDevelopment && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="text-sm font-semibold text-destructive">Erro (apenas visível em desenvolvimento):</div>
              <div className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </div>
              {error.stack && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">Stack trace</summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-60 bg-background p-2 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={reset} className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/dashboard')}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </div>

          {/* Help text */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            Se o problema persistir, entre em contato com o suporte.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact error fallback for smaller sections
export function CompactErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Erro ao carregar conteúdo</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
      </div>
      <Button onClick={reset} size="sm">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

export { ErrorBoundary };
