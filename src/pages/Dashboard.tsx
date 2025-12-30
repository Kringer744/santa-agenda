import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Tooth, CalendarCheck, Users, TrendingUp, Loader2, Stethoscope } from 'lucide-react'; // Updated icons
import { useConsultas } from '@/hooks/useConsultas'; // Changed hook
import { useDentistas } from '@/hooks/useDentistas'; // Changed hook
import { usePacientes } from '@/hooks/usePacientes'; // Changed hook
import { useClinicas } from '@/hooks/useClinicas'; // Changed hook
import { useProcedimentos } from '@/hooks/useProcedimentos'; // Changed hook
import { useAgendaDia } from '@/hooks/useAgendaDia'; // Changed hook
import { ConsultasList } from '@/components/dashboard/ConsultasList'; // Changed component
import { ProcedimentosHoje } from '@/components/dashboard/ProcedimentosHoje'; // Changed component
import { AgendaChart } from '@/components/dashboard/AgendaChart'; // Changed component
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  agendada: 'bg-honey-light text-accent-foreground',
  confirmada: 'bg-mint-light text-secondary',
  realizada: 'bg-coral-light text-primary',
  cancelada: 'bg-destructive/10 text-destructive',
  reagendada: 'bg-blush-light text-blush',
};

export default function Dashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data: consultas = [], isLoading: loadingConsultas } = useConsultas();
  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas();
  const { data: procedimentos = [], isLoading: loadingProcedimentos } = useProcedimentos();
  const { data: agendaDia = [], isLoading: loadingAgendaDia } = useAgendaDia();

  const isLoading = loadingConsultas || loadingDentistas || loadingPacientes || loadingClinicas || loadingProcedimentos || loadingAgendaDia;

  const consultasAgendadas = consultas.filter(c => c.status === 'agendada' || c.status === 'confirmada').length;
  const consultasHoje = consultas.filter(c => c.data_hora_inicio.startsWith(hoje) && (c.status === 'agendada' || c.status === 'confirmada'));
  const consultasRealizadasHoje = consultas.filter(c => c.data_hora_inicio.startsWith(hoje) && c.status === 'realizada');
  const pacientesAtivos = pacientes.length;

  // Calcular ocupação (exemplo: baseado em consultas agendadas vs. capacidade total de atendimentos das clínicas)
  const totalCapacidadeAtendimentos = clinicas.reduce((acc, c) => acc + c.capacidade_atendimentos, 0);
  const ocupacaoTotal = totalCapacidadeAtendimentos > 0 
    ? Math.round((consultasAgendadas / totalCapacidadeAtendimentos) * 100)
    : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Visão geral da clínica • {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Consultas Agendadas"
            value={consultasAgendadas}
            subtitle="próximos dias"
            icon={<CalendarCheck className="w-6 h-6" />}
            variant="coral"
          />
          <StatsCard
            title="Consultas Hoje"
            value={consultasHoje.length}
            subtitle="agendadas"
            icon={<Stethoscope className="w-6 h-6" />}
            variant="mint"
          />
          <StatsCard
            title="Ocupação"
            value={`${ocupacaoTotal}%`}
            subtitle="da capacidade"
            icon={<TrendingUp className="w-6 h-6" />}
            variant="honey"
          />
          <StatsCard
            title="Pacientes Ativos"
            value={pacientesAtivos}
            subtitle="cadastrados"
            icon={<Users className="w-6 h-6" />}
            variant="blush"
          />
        </div>

        {/* Consultas do dia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Consultas Agendadas Hoje */}
          <ConsultasList 
            title="Consultas Agendadas Hoje" 
            type="agendada" 
            consultas={consultasHoje.filter(c => c.status === 'agendada' || c.status === 'confirmada')} 
            dentistas={dentistas} 
            pacientes={pacientes} 
          />

          {/* Consultas Realizadas Hoje */}
          <ConsultasList 
            title="Consultas Realizadas Hoje" 
            type="realizada" 
            consultas={consultasRealizadasHoje} 
            dentistas={dentistas} 
            pacientes={pacientes} 
          />

          {/* Próximas Consultas */}
          <ConsultasList 
            title="Próximas Consultas" 
            type="proximas" 
            consultas={consultas.filter(c => c.data_hora_inicio > new Date().toISOString() && (c.status === 'agendada' || c.status === 'confirmada')).slice(0, 5)} 
            dentistas={dentistas} 
            pacientes={pacientes} 
          />
        </div>

        {/* Procedimentos e Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ProcedimentosHoje consultas={consultas.filter(c => c.status === 'realizada')} procedimentos={procedimentos} />
          <AgendaChart agenda={agendaDia} dentistas={dentistas} clinicas={clinicas} />
        </div>
      </div>
    </Layout>
  );
}