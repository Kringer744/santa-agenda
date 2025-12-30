import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CalendarCheck, Users, TrendingUp, Loader2, Stethoscope } from 'lucide-react'; 
import { useConsultas } from '@/hooks/useConsultas';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useProcedimentos } from '@/hooks/useProcedimentos';
import { useAgendaDia } from '@/hooks/useAgendaDia';
import { ConsultasList } from '@/components/dashboard/ConsultasList';
import { ProcedimentosHoje } from '@/components/dashboard/ProcedimentosHoje';
import { AgendaChart } from '@/components/dashboard/AgendaChart';

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <ConsultasList 
            title="Consultas Agendadas Hoje" 
            type="agendada" 
            consultas={consultasHoje.filter(c => c.status === 'agendada' || c.status === 'confirmada')} 
            dentistas={dentistas} 
            pacientes={pacientes} 
          />
          <ConsultasList 
            title="Consultas Realizadas Hoje" 
            type="realizada" 
            consultas={consultasRealizadasHoje} 
            dentistas={dentistas} 
            pacientes={pacientes} 
          />
          <ConsultasList 
            title="Próximas Consultas" 
            type="proximas" 
            consultas={consultas.filter(c => c.data_hora_inicio > new Date().toISOString() && (c.status === 'agendada' || c.status === 'confirmada')).slice(0, 5)} 
            dentistas={dentistas} 
            pacientes={pacientes} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ProcedimentosHoje consultas={consultas.filter(c => c.status === 'realizada')} procedimentos={procedimentos} />
          <AgendaChart agenda={agendaDia} dentistas={dentistas} clinicas={clinicas} />
        </div>
      </div>
    </Layout>
  );
}