import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'dental' | 'soft' | 'muted';
}

const variantStyles = {
  default: 'bg-card border border-border',
  dental: 'bg-primary text-white',
  soft: 'bg-secondary/30 border border-secondary/50',
  muted: 'bg-muted/50 border border-border',
};

const iconContainerStyles = {
  default: 'bg-primary/10 text-primary',
  dental: 'bg-white/20 text-white',
  soft: 'bg-primary/20 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

export function StatsCard({ title, value, subtitle, icon, variant = 'default' }: StatsCardProps) {
  return (
    <div 
      className={cn(
        "rounded-xl p-5 shadow-card transition-all duration-300 hover:shadow-elevated animate-fade-in",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", variant === 'dental' ? "text-white/80" : "text-muted-foreground")}>
            {title}
          </p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className={cn("text-xs", variant === 'dental' ? "text-white/70" : "text-muted-foreground")}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shadow-sm",
          iconContainerStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}