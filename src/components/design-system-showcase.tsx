'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label,
  Badge,
  LoadingSpinner,
  LoadingState,
  cn
} from '@/src/components/ui';
import { ThemeProvider } from '@/src/components/ui/theme-provider';

export function DesignSystemShowcase() {
  const [loading, setLoading] = React.useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <div className="container-responsive space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
          <p className="text-muted-foreground">
            Componentes UI consolidados com Radix primitives e Tailwind CSS
          </p>
        </div>
        <div className="w-10 h-10 bg-muted rounded-full" />
      </div>

      <div className="grid-responsive">
        {/* Button Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Diferentes variantes e tamanhos de botões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="info">Info</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>
              Inputs, labels e outros elementos de formulário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
              />
            </div>
            <div className="form-group">
              <Label htmlFor="name">Nome</Label>
              <Input 
                id="name" 
                placeholder="Seu nome completo" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>
              Indicadores de status e categorias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="soft">Soft</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="default">Default</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="status-success">Ativo</Badge>
              <Badge className="status-warning">Pendente</Badge>
              <Badge className="status-error">Erro</Badge>
              <Badge className="status-info">Info</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>
              Diferentes estados de carregamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
            
            {loading ? (
              <LoadingState text="Processando..." />
            ) : (
              <Button onClick={handleAsyncAction}>
                Testar Loading
              </Button>
            )}
          </CardContent>
        </Card>

        {/* CSS Classes Demo */}
        <Card>
          <CardHeader>
            <CardTitle>CSS Utility Classes</CardTitle>
            <CardDescription>
              Padrões de CSS pré-definidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="poker-stats">
              <div className="poker-stat-item">
                <div className="poker-stat-value">150</div>
                <div className="poker-stat-label">Jogos</div>
              </div>
              <div className="poker-stat-item">
                <div className="poker-stat-value">R$ 2.500</div>
                <div className="poker-stat-label">Lucro</div>
              </div>
              <div className="poker-stat-item">
                <div className="poker-stat-value">75%</div>
                <div className="poker-stat-label">Win Rate</div>
              </div>
              <div className="poker-stat-item">
                <div className="poker-stat-value">12h</div>
                <div className="poker-stat-label">Tempo</div>
              </div>
            </div>
            
            <div className="neon-poker">
              Poker SaaS Platform
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>
              Hierarquia tipográfica padrão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1>Heading 1 - 36px</h1>
            <h2>Heading 2 - 30px</h2>
            <h3>Heading 3 - 24px</h3>
            <h4>Heading 4 - 20px</h4>
            <h5>Heading 5 - 18px</h5>
            <h6>Heading 6 - 16px</h6>
            <p className="text-base">
              Parágrafo padrão com texto regular para leitura confortável.
            </p>
            <p className="text-sm text-muted-foreground">
              Texto menor com cor mais sutil para informações secundárias.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
          <CardDescription>
            Implementação e refatoração recomendadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>1. Migração de Componentes</h4>
            <p>Substituir componentes antigos pelos novos da pasta <code>src/components/ui</code></p>
            
            <h4>2. Remoção de Estilos Inline</h4>
            <p>Eliminar <code>style={'{{}}'}</code> e usar classes Tailwind ou CSS patterns</p>
            
            <h4>3. Padronização de Modais</h4>
            <p>Migrar todos os modais para usar o novo sistema com <code>ModalProvider</code></p>
            
            <h4>4. Implementação de TanStack Query</h4>
            <p>Adicionar cache e gerenciamento de estado remoto para APIs</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Ver Documentação Completa
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}