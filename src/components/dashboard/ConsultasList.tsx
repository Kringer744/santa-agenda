import { Consulta, Dentista, Paciente } from '@/types'; // Updated types
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsultasListProps {
  consultas: Consulta[];
  dentistas: Dentista[]; // Changed from pets
  pacientes: Paciente[]; // Changed from tutores
  title: string;
  type: 'agendada' | 'realizada' | 'proximas'; // Updated types
}

const statusColors: Record<string, string> = {
  agendada: 'bg-honey-light text-accent-foreground',
  confirmada: 'bg-mint-light text-secondary',
  realizada: 'bg-coral-light text-primary',
  cancelada: 'bg-destructive/10 text-destructive',
  reagendada: 'bg-blush-light text-blush',
};

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
};

export function ConsultasList({ consultas, dentistas, pacientes, title, type }: ConsultasListProps) {
  const getDentista = (dentistaId: string) => dentistas.find(d => d.id === dentistaId); // Changed from getPet
  const getPaciente = (pacienteId: string) => pacientes.find(p => p.id === pacienteId); // Changed from getTutor

  const getIcon = () => {
    switch (type) {
      case 'agendada': return '🗓️';
      case 'realizada': return '✅';
      case 'proximas': return '➡️';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl md:text-2xl">{getIcon()}</span>
        <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs md:text-sm">
          {consultas.length}
        </Badge>
      </div>
      
      {consultas.length === 0 ? (
        <p className="text-xs md:text-sm text-muted-foreground text-center py-8">
          Nenhuma consulta para hoje
        </p>
      ) : (
        <div className="space-y-3">
          {consultas.map((consulta, index) => {
            const dentista = getDentista(consulta.dentista_id); // Changed from pet
            const paciente = getPaciente(consulta.paciente_id); // Changed from tutor
            
            return (
              <div 
                key={consulta.id}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-coral-light flex items-center justify-center text-xl md:text-2xl">
                  🦷
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate text-sm md:text-base">{paciente?.nome}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{dentista?.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(consulta.data_hora_inicio), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
                
                <div className="text-right">
                  <Badge className={cn("text-xs", statusColors[consulta.status])}>
                    {statusLabels[consulta.status]}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {consulta.codigo_consulta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}