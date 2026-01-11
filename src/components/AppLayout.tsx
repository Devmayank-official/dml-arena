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
          <main className="flex-1 min-w-0">
            {children}
          </main>
          {/* Desktop sidebar on right side - hidden on mobile */}
          {!isMobile && <AppSidebar />}
        </div>
        {/* Floating sidebar trigger for desktop - visible when collapsed */}
        {!isMobile && (
          <div className="fixed bottom-4 right-4 z-40 hidden md:block">
            <SidebarTrigger className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90" />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
