import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader'; // Importar o novo componente MobileHeader
import { useIsMobile } from '@/hooks/use-mobile'; // Importar o hook useIsMobile

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileHeader /> : <Sidebar />} {/* Renderiza MobileHeader no celular, Sidebar no desktop */}
      <main className="lg:ml-64 min-h-screen transition-all duration-300"> {/* ml-64 apenas em telas grandes */}
        <div className="p-4 md:p-8"> {/* Padding ajustado para mobile */}
          {children}
        </div>
      </main>
    </div>
  );
}