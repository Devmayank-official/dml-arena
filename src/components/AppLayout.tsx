import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <div className="flex flex-1 w-full">
          {/* Desktop sidebar on left side - hidden on mobile */}
          {!isMobile && <AppSidebar />}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
