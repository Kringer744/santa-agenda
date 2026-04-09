import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Stethoscope,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Headset,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-50 flex flex-col shadow-sm",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg gradient-dental flex items-center justify-center flex-shrink-0 shadow-soft">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-foreground tracking-tight whitespace-nowrap">DentalClinic</span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white font-medium shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-primary",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:text-primary")} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center text-muted-foreground hover:text-primary"
        >
          {collapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2"><ChevronLeft size={18} /> <span>Recolher</span></div>}
        </Button>
      </div>
    </aside>
  );
}