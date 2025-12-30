import { AgendaDentista, Dentista } from '@/types'; // Removed Clinica
import { cn } from '@/lib/utils';

interface AgendaChartProps {
  agenda: AgendaDentista[]; // Changed from vagas
  dentistas: Dentista[];
  clinicas: any[]; // Changed to any to satisfy the prop but kept simple
}

export function AgendaChart({ agenda, dentistas }: AgendaChartProps) { // Removed clinicas from destructuring
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
  };

  const getDentistaName = (id: string) => dentistas.find(d => d.id === id)?.nome || 'Dentista Desconhecido';
  
  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-card animate-slide-up">
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">Agenda por Dentista</h3>
      
      <div className="space-y-3 md:space-y-4">
        {agenda.map((item, index) => {
          const ocupacaoPercent = (item.horarios_ocupados.length / item.horarios_disponiveis.length) * 100;
          
          return (
            <div 
              key={item.id}
              className="space-y-1 md:space-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="font-medium text-foreground">{formatDate(item.data)} - {getDentistaName(item.dentista_id)}</span>
                <div className="flex gap-2 md:gap-4 text-xs text-muted-foreground">
                  <span>{item.horarios_ocupados.length}/{item.horarios_disponiveis.length} horários ocupados</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 h-2 md:h-3 bg-coral-light rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      ocupacaoPercent > 80 ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${ocupacaoPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border flex items-center justify-center gap-4 md:gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Ocupação da Agenda</span>
        </div>
      </div>
    </div>
  );
}