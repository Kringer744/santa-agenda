import { Reserva, Pet, Tutor } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReservasListProps {
  reservas: Reserva[];
  pets: Pet[];
  tutores: Tutor[];
  title: string;
  type: 'checkin' | 'checkout' | 'hospedados';
}

const statusColors: Record<string, string> = {
  pendente: 'bg-honey-light text-accent-foreground',
  confirmada: 'bg-mint-light text-secondary',
  checkin: 'bg-coral-light text-primary',
  hospedado: 'bg-secondary text-secondary-foreground',
  checkout: 'bg-honey text-accent-foreground',
  finalizada: 'bg-muted text-muted-foreground',
  cancelada: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  checkin: 'Check-in',
  hospedado: 'Hospedado',
  checkout: 'Check-out',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

export function ReservasList({ reservas, pets, tutores, title, type }: ReservasListProps) {
  const getPet = (petId: string) => pets.find(p => p.id === petId);
  const getTutor = (tutorId: string) => tutores.find(t => t.id === tutorId);

  const getIcon = () => {
    switch (type) {
      case 'checkin': return '📥';
      case 'checkout': return '📤';
      case 'hospedados': return '🏠';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{getIcon()}</span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {reservas.length}
        </Badge>
      </div>
      
      {reservas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma reserva para hoje
        </p>
      ) : (
        <div className="space-y-3">
          {reservas.map((reserva, index) => {
            const pet = getPet(reserva.pet_id);
            const tutor = getTutor(reserva.tutor_id);
            
            return (
              <div 
                key={reserva.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-coral-light flex items-center justify-center text-2xl">
                  {pet?.especie === 'cachorro' ? '🐶' : '🐱'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{pet?.nome}</p>
                  <p className="text-sm text-muted-foreground truncate">{tutor?.nome}</p>
                </div>
                
                <div className="text-right">
                  <Badge className={cn("text-xs", statusColors[reserva.status])}>
                    {statusLabels[reserva.status]}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reserva.codigo_estadia}
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