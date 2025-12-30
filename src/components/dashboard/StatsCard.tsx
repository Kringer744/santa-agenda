import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'coral' | 'mint' | 'honey' | 'blush';
}

const variantStyles = {
  default: 'bg-card',
  coral: 'bg-coral-light',
  mint: 'bg-mint-light',
  honey: 'bg-honey-light',
  blush: 'bg-blush-light',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  coral: 'bg-primary/20 text-primary',
  mint: 'bg-secondary/20 text-secondary',
  honey: 'bg-accent/30 text-accent-foreground',
  blush: 'bg-blush/20 text-blush',
};

export function StatsCard({ title, value, subtitle, icon, trend, variant = 'default' }: StatsCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl p-6 shadow-card transition-all duration-300 hover:shadow-elevated animate-fade-in",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "mt-2 text-sm font-medium",
              trend.positive ? "text-secondary" : "text-destructive"
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% vs. semana passada
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          iconStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}