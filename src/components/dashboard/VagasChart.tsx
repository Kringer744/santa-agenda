import { VagaDia } from '@/types';
import { cn } from '@/lib/utils';

interface VagasChartProps {
  vagas: VagaDia[];
}

export function VagasChart({ vagas }: VagasChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-6">Ocupação por Dia</h3>
      
      <div className="space-y-4">
        {vagas.map((vaga, index) => {
          const cachorroPercent = (vaga.vagas_cachorro_ocupadas / vaga.vagas_cachorro_total) * 100;
          const gatoPercent = (vaga.vagas_gato_ocupadas / vaga.vagas_gato_total) * 100;
          
          return (
            <div 
              key={vaga.id} // Use vaga.id as key
              className="space-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{formatDate(vaga.data)}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>🐶 {vaga.vagas_cachorro_ocupadas}/{vaga.vagas_cachorro_total}</span>
                  <span>🐱 {vaga.vagas_gato_ocupadas}/{vaga.vagas_gato_total}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {/* Cachorro bar */}
                <div className="flex-1 h-3 bg-coral-light rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      cachorroPercent > 80 ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${cachorroPercent}%` }}
                  />
                </div>
                
                {/* Gato bar */}
                <div className="flex-1 h-3 bg-mint-light rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      gatoPercent > 80 ? "bg-destructive" : "bg-secondary"
                    )}
                    style={{ width: `${gatoPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Cachorros</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span className="text-muted-foreground">Gatos</span>
        </div>
      </div>
    </div>
  );
}