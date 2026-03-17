import { Consulta, Dentista, Paciente } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock4 } from 'lucide-react';

interface ConsultasListProps {
  consultas: Consulta[];
  dentistas: Dentista[];
  pacientes: Paciente[];
  title: string;
  type: 'agendada' | 'confirmada' | 'realizada' | 'proximas';
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

const pagamentoColors: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-600 border-amber-200',
  pago: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  cancelado: 'bg-gray-100 text-gray-400',
};

export function ConsultasList({ consultas, dentistas, pacientes, title, type }: ConsultasListProps) {
  const getDentista = (dentistaId: string) => dentistas.find(d => d.id === dentistaId);
  const getPaciente = (pacienteId: string) => pacientes.find(p => p.id === pacienteId);

  const getIcon = () => {
    switch (type) {
      case 'confirmada': return '✅';
      case 'agendada': return '🗓️';
      case 'realizada': return '✔️';
      case 'proximas': return '📅';
    }
  };

  // Ordenar por horário (mais cedo primeiro)
  const sorted = [...consultas].sort((a, b) =>
    new Date(a.data_hora_inicio).getTime() - new Date(b.data_hora_inicio).getTime()
  );

  const emptyMessage = type === 'proximas'
    ? 'Nenhuma consulta agendada para amanhã'
    : 'Nenhuma consulta para hoje';

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl md:text-2xl">{getIcon()}</span>
        <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs md:text-sm">
          {consultas.length}
        </Badge>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs md:text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((consulta, index) => {
            const dentista = getDentista(consulta.dentista_id);
            const paciente = getPaciente(consulta.paciente_id);
            const pagStatus = (consulta as any).pagamento_status as string || 'pendente';

            return (
              <div
                key={consulta.id}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-coral-light flex items-center justify-center text-xl md:text-2xl shrink-0">
                  🦷
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-foreground truncate text-sm md:text-base">{paciente?.nome}</p>
                    {paciente?.is_menor_idade && (
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-50 text-amber-600 border-amber-200 shrink-0">MENOR</Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{dentista?.nome}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {format(new Date(consulta.data_hora_inicio), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <Badge className={cn("text-[9px] block", statusColors[consulta.status])}>
                    {statusLabels[consulta.status]}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[9px] flex items-center gap-0.5 justify-end border", pagamentoColors[pagStatus])}>
                    {pagStatus === 'pago'
                      ? <><CheckCircle2 size={8} /> Pago</>
                      : <><Clock4 size={8} /> Pendente</>
                    }
                  </Badge>
                  {consulta.codigo_consulta && (
                    <p className="text-[9px] text-muted-foreground font-mono">{consulta.codigo_consulta}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
