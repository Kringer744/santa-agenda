import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Tooth, 
  MessageSquare, 
  Settings, 
  Menu 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarCheck, label: 'Consultas', path: '/consultas' },
  { icon: Users, label: 'Pacientes', path: '/pacientes' },
  { icon: Tooth, label: 'Dentistas', path: '/dentistas' },
  { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border p-4 flex items-center justify-between lg:hidden">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
          <Tooth className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-foreground">DentalClinic</span>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen} direction="left">
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-64 h-full mt-0 rounded-none">
          <div className="flex flex-col h-full">
            {/* Logo inside drawer */}
            <div className="h-16 flex items-center justify-center border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
                  <Tooth className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg text-foreground">DentalClinic</span>
              </div>
            </div>

            {/* Navigation inside drawer */}
            <nav className="flex-1 py-6 px-3">
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                          isActive 
                            ? "bg-coral-light text-primary font-semibold shadow-sm" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}