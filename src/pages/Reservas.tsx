import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Search, ChevronRight } from 'lucide-react';
import { reservasMock, petsMock, tutoresMock, unidades } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusColors = {
  pendente: 'bg-honey-light text-accent-foreground border-honey',
  confirmada: 'bg-mint-light text-secondary border-mint',
  checkin: 'bg-coral-light text-primary border-coral',
  hospedado: 'bg-secondary text-secondary-foreground border-secondary',
  checkout: 'bg-honey text-accent-foreground border-honey',
  finalizada: 'bg-muted text-muted-foreground border-muted',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/30',
};

const statusLabels = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  checkin: 'Check-in',
  hospedado: 'Hospedado',
  checkout: 'Check-out',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

export default function Reservas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const getPet = (petId: string) => petsMock.find(p => p.id === petId);
  const getTutor = (tutorId: string) => tutoresMock.find(t => t.id === tutorId);
  const getUnidade = (unidadeId: string) => unidades.find(u => u.id === unidadeId);

  const filteredReservas = reservasMock.filter(reserva => {
    const pet = getPet(reserva.petId);
    const tutor = getTutor(reserva.tutorId);
    
    const matchSearch = 
      pet?.nome.toLowerCase().includes(search.toLowerCase()) ||
      tutor?.nome.toLowerCase().includes(search.toLowerCase()) ||
      reserva.codigoEstadia.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || reserva.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reservas</h1>
            <p className="text-muted-foreground mt-1">
              {reservasMock.length} reservas no sistema
            </p>
          </div>
          
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Nova Reserva
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por pet, tutor ou código..."
              className="pl-12 h-12 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="checkin">Check-in</SelectItem>
              <SelectItem value="hospedado">Hospedado</SelectItem>
              <SelectItem value="checkout">Check-out</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservas List */}
        <div className="space-y-4">
          {filteredReservas.map((reserva, index) => {
            const pet = getPet(reserva.petId);
            const tutor = getTutor(reserva.tutorId);
            const unidade = getUnidade(reserva.unidadeId);
            
            return (
              <div 
                key={reserva.id}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Pet Avatar */}
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0",
                    pet?.especie === 'cachorro' ? 'bg-coral-light' : 'bg-mint-light'
                  )}>
                    {pet?.especie === 'cachorro' ? '🐶' : '🐱'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">{pet?.nome}</h3>
                      <Badge className={cn("border", statusColors[reserva.status])}>
                        {statusLabels[reserva.status]}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-mono">
                        {reserva.codigoEstadia}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      Tutor: {tutor?.nome} • {unidade?.nome}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-foreground font-medium">
                          {new Date(reserva.checkIn).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground font-medium">
                          {new Date(reserva.checkOut).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    {reserva.servicosAdicionais.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {reserva.servicosAdicionais.map(servico => (
                          <Badge key={servico.id} variant="secondary" className="text-xs">
                            {servico.icone} {servico.nome}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Price & Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        R$ {reserva.valorTotal.toFixed(2)}
                      </p>
                      <Badge 
                        variant={reserva.pagamentoStatus === 'aprovado' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs mt-1",
                          reserva.pagamentoStatus === 'aprovado' 
                            ? 'bg-secondary text-secondary-foreground' 
                            : 'bg-honey-light text-accent-foreground'
                        )}
                      >
                        {reserva.pagamentoStatus === 'aprovado' ? '✓ Pago' : '⏳ Pendente'}
                      </Badge>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
