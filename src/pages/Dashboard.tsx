import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PawPrint, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useReservas } from '@/hooks/useReservas';
import { usePets } from '@/hooks/usePets';
import { useTutores } from '@/hooks/useTutores';
import { useUnidades } from '@/hooks/useUnidades';
import { useServicos } from '@/hooks/useServicos';
import { useVagasDia } from '@/hooks/useVagasDia';
import { ReservasList } from '@/components/dashboard/ReservasList';
import { ServicosHoje } from '@/components/dashboard/ServicosHoje';
import { VagasChart } from '@/components/dashboard/VagasChart';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pendente: 'bg-honey-light text-accent-foreground',
  confirmada: 'bg-mint-light text-secondary',
  checkin: 'bg-coral-light text-primary',
  hospedado: 'bg-secondary text-secondary-foreground',
  checkout: 'bg-honey text-accent-foreground',
  finalizada: 'bg-muted text-muted-foreground',
  cancelada: 'bg-destructive/10 text-destructive',
};

export default function Dashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data: reservas = [], isLoading: loadingReservas } = useReservas();
  const { data: pets = [], isLoading: loadingPets } = usePets();
  const { data: tutores = [], isLoading: loadingTutores } = useTutores();
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: servicosAdicionais = [], isLoading: loadingServicos } = useServicos();
  const { data: vagasDia = [], isLoading: loadingVagasDia } = useVagasDia();

  const isLoading = loadingReservas || loadingPets || loadingTutores || loadingUnidades || loadingServicos || loadingVagasDia;

  const petsHospedados = reservas.filter(r => r.status === 'hospedado').length;
  const checkinsHoje = reservas.filter(r => r.check_in === hoje && (r.status === 'confirmada' || r.status === 'pendente'));
  const checkoutsHoje = reservas.filter(r => r.check_out === hoje && r.status === 'hospedado');
  const hospedadosHoje = reservas.filter(r => r.status === 'hospedado');

  // Calcular ocupação
  const totalCapacidade = unidades.reduce((acc, u) => acc + u.capacidade_cachorro + u.capacidade_gato, 0);
  const ocupacaoTotal = totalCapacidade > 0 
    ? Math.round((petsHospedados / totalCapacidade) * 100)
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
            Visão geral do hotel • {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Pets Hospedados"
            value={petsHospedados}
            subtitle="agora no hotel"
            icon={<PawPrint className="w-6 h-6" />}
            variant="coral"
          />
          <StatsCard
            title="Check-ins Hoje"
            value={checkinsHoje.length}
            subtitle="aguardando"
            icon={<Calendar className="w-6 h-6" />}
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
            title="Tutores Ativos"
            value={tutores.length}
            subtitle="cadastrados"
            icon={<Users className="w-6 h-6" />}
            variant="blush"
          />
        </div>

        {/* Reservas do dia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Check-ins Hoje */}
          <ReservasList 
            title="Check-ins Hoje" 
            type="checkin" 
            reservas={checkinsHoje} 
            pets={pets} 
            tutores={tutores} 
          />

          {/* Hospedados */}
          <ReservasList 
            title="Hospedados" 
            type="hospedados" 
            reservas={hospedadosHoje} 
            pets={pets} 
            tutores={tutores} 
          />

          {/* Check-outs Hoje */}
          <ReservasList 
            title="Check-outs Hoje" 
            type="checkout" 
            reservas={checkoutsHoje} 
            pets={pets} 
            tutores={tutores} 
          />
        </div>

        {/* Serviços e Vagas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ServicosHoje reservas={reservas.filter(r => r.status === 'hospedado')} servicosAdicionais={servicosAdicionais} />
          <VagasChart vagas={vagasDia} />
        </div>
      </div>
    </Layout>
  );
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  checkin: 'Check-in',
  hospedado: 'Hospedado',
  checkout: 'Check-out',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};