import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Stethoscope,
  MessageSquare,
  Settings,
  Menu,
  CalendarDays,
  Headset,
  Bot
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
  { icon: CalendarDays, label: 'Agenda', path: '/agenda' },
  { icon: Users, label: 'Pacientes', path: '/pacientes' },
  { icon: Stethoscope, label: 'Dentistas', path: '/dentistas' },
  { icon: Headset, label: 'Atendimento', path: '/atendimento' },
  { icon: Bot, label: 'IA Config', path: '/ia' },
  { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border p-4 flex items-center justify-between lg:hidden">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg gradient-dental flex items-center justify-center shadow-soft">
          <Stethoscope className="w-4 h-4 text-white" />
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
            <div className="h-16 flex items-center justify-center border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-dental flex items-center justify-center shadow-soft">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-lg text-foreground">DentalClinic</span>
              </div>
            </div>

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
                            ? "bg-primary text-white font-semibold shadow-sm" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
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