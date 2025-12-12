import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { VagasChart } from '@/components/dashboard/VagasChart';
import { ReservasList } from '@/components/dashboard/ReservasList';
import { ServicosHoje } from '@/components/dashboard/ServicosHoje';
import { PawPrint, Calendar, Users, TrendingUp } from 'lucide-react';
import { reservasMock, petsMock, tutoresMock, vagasDiaMock } from '@/data/mockData';

export default function Dashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  
  const petsHospedados = reservasMock.filter(r => r.status === 'hospedado').length;
  const checkinsHoje = reservasMock.filter(r => r.checkIn === hoje && r.status === 'confirmada');
  const checkoutsHoje = reservasMock.filter(r => r.checkOut === hoje && r.status === 'hospedado');
  const hospedadosHoje = reservasMock.filter(r => r.status === 'hospedado');
  
  const vagasHoje = vagasDiaMock.find(v => v.data === '2024-12-12') || vagasDiaMock[0];
  const ocupacaoTotal = vagasHoje 
    ? Math.round(((vagasHoje.vagasCachorroOcupadas + vagasHoje.vagasGatoOcupadas) / 
        (vagasHoje.vagasCachorroTotal + vagasHoje.vagasGatoTotal)) * 100)
    : 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do hotel • {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pets Hospedados"
            value={petsHospedados}
            subtitle="agora no hotel"
            icon={<PawPrint className="w-6 h-6" />}
            variant="coral"
            trend={{ value: 12, positive: true }}
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
            value={tutoresMock.length}
            subtitle="cadastrados"
            icon={<Users className="w-6 h-6" />}
            variant="blush"
          />
        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VagasChart vagas={vagasDiaMock} />
          </div>
          <div>
            <ServicosHoje reservas={hospedadosHoje} />
          </div>
        </div>

        {/* Reservas do dia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReservasList 
            reservas={checkinsHoje} 
            pets={petsMock} 
            tutores={tutoresMock}
            title="Check-ins Hoje"
            type="checkin"
          />
          <ReservasList 
            reservas={hospedadosHoje} 
            pets={petsMock} 
            tutores={tutoresMock}
            title="Hospedados"
            type="hospedados"
          />
          <ReservasList 
            reservas={checkoutsHoje} 
            pets={petsMock} 
            tutores={tutoresMock}
            title="Check-outs Hoje"
            type="checkout"
          />
        </div>
      </div>
    </Layout>
  );
}
