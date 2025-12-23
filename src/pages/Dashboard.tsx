import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PawPrint, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useReservas } from '@/hooks/useReservas';
import { usePets } from '@/hooks/usePets';
import { useTutores } from '@/hooks/useTutores';
import { useUnidades } from '@/hooks/useUnidades';
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
  const { data: unidades = [] } = useUnidades();

  const isLoading = loadingReservas || loadingPets || loadingTutores;

  const petsHospedados = reservas.filter(r => r.status === 'hospedado').length;
  const checkinsHoje = reservas.filter(r => r.check_in === hoje && (r.status === 'confirmada' || r.status === 'pendente'));
  const checkoutsHoje = reservas.filter(r => r.check_out === hoje && r.status === 'hospedado');
  const hospedadosHoje = reservas.filter(r => r.status === 'hospedado');

  // Calcular ocupação
  const totalCapacidade = unidades.reduce((acc, u) => acc + u.capacidade_cachorro + u.capacidade_gato, 0);
  const ocupacaoTotal = totalCapacidade > 0 
    ? Math.round((petsHospedados / totalCapacidade) * 100)
    : 0;

  const getPet = (petId: string) => pets.find(p => p.id === petId);
  const getTutor = (tutorId: string) => tutores.find(t => t.id === tutorId);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Check-ins Hoje */}
          <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint" />
              Check-ins Hoje ({checkinsHoje.length})
            </h3>
            {checkinsHoje.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum check-in hoje</p>
            ) : (
              <div className="space-y-3">
                {checkinsHoje.map(reserva => {
                  const pet = getPet(reserva.pet_id);
                  const tutor = getTutor(reserva.tutor_id);
                  return (
                    <div key={reserva.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <span className="text-2xl">{pet?.especie === 'cachorro' ? '🐶' : '🐱'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{pet?.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{tutor?.nome}</p>
                      </div>
                      <Badge className={cn("text-xs", statusColors[reserva.status])}>
                        {statusLabels[reserva.status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hospedados */}
          <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Hospedados ({hospedadosHoje.length})
            </h3>
            {hospedadosHoje.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pet hospedado</p>
            ) : (
              <div className="space-y-3">
                {hospedadosHoje.slice(0, 5).map(reserva => {
                  const pet = getPet(reserva.pet_id);
                  const tutor = getTutor(reserva.tutor_id);
                  return (
                    <div key={reserva.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <span className="text-2xl">{pet?.especie === 'cachorro' ? '🐶' : '🐱'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{pet?.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{tutor?.nome}</p>
                      </div>
                    </div>
                  );
                })}
                {hospedadosHoje.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{hospedadosHoje.length - 5} mais
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Check-outs Hoje */}
          <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-honey" />
              Check-outs Hoje ({checkoutsHoje.length})
            </h3>
            {checkoutsHoje.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum check-out hoje</p>
            ) : (
              <div className="space-y-3">
                {checkoutsHoje.map(reserva => {
                  const pet = getPet(reserva.pet_id);
                  const tutor = getTutor(reserva.tutor_id);
                  return (
                    <div key={reserva.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <span className="text-2xl">{pet?.especie === 'cachorro' ? '🐶' : '🐱'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{pet?.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{tutor?.nome}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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