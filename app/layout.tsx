import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Providers } from '@/src/components/providers';
import { ModalProvider } from '@/src/components/providers/modal-provider';

export const metadata: Metadata = {
  title: 'Poker Manager - Sistema de Gestão de Partidas',
  description: 'Sistema completo para gestão de partidas de poker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <ModalProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ModalProvider>
        </Providers>
      </body>
    </html>
  );
}

