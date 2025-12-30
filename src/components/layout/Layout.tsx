import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileHeader /> : <Sidebar />}
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}