import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CalendarCheck, Users, TrendingUp, Loader2, Stethoscope, Clock, MessageSquare } from 'lucide-react'; 
import { useConsultas } from '@/hooks/useConsultas';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { ConsultasList } from '@/components/dashboard/ConsultasList';
import { AgendaChart } from '@/components/dashboard/AgendaChart';
import { useAgendaDia } from '@/hooks/useAgendaDia';

export default function Dashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data: consultas = [], isLoading: loadingConsultas } = useConsultas();
  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas();
  const { data: agendaDia = [], isLoading: loadingAgenda } = useAgendaDia();

  const isLoading = loadingConsultas || loadingDentistas || loadingPacientes || loadingClinicas || loadingAgenda;

  const consultasHoje = consultas.filter(c => c.data_hora_inicio.startsWith(hoje));
  const consultasPendentes = consultas.filter(c => c.status === 'agendada' || c.status === 'confirmada').length;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Controle</h1>
            <p className="text-muted-foreground mt-1">
              Bem-vindo ao DentalClinic • {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2 text-sm font-medium text-primary">
            <Clock size={16} /> Próximo atendimento em 15 min
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Pacientes"
            value={pacientes.length}
            icon={<Users size={24} />}
            variant="dental"
          />
          <StatsCard
            title="Total de Dentistas"
            value={dentistas.length}
            icon={<Stethoscope size={24} />}
            variant="soft"
          />
          <StatsCard
            title="Consultas Hoje"
            value={consultasHoje.length}
            subtitle="Atendimentos previstos"
            icon={<CalendarCheck size={24} />}
          />
          <StatsCard
            title="Agendamentos"
            value={consultasPendentes}
            subtitle="Pendentes/Confirmados"
            icon={<TrendingUp size={24} />}
            variant="muted"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConsultasList 
              title="Atendimentos de Hoje" 
              type="agendada" 
              consultas={consultasHoje} 
              dentistas={dentistas} 
              pacientes={pacientes} 
            />
          </div>
          <div className="space-y-6">
            <AgendaChart agenda={agendaDia.slice(0, 5)} dentistas={dentistas} clinicas={clinicas} />
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                <MessageSquare size={18} /> Lembretes WhatsApp
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Existem {consultasHoje.length} pacientes aguardando confirmação para amanhã.
              </p>
              <button className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                Enviar Lembretes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}