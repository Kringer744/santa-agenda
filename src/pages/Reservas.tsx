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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Search, ChevronRight, Loader2 } from 'lucide-react';
import { useReservas, useCreateReserva, useUpdateReservaStatus } from '@/hooks/useReservas';
import { usePets } from '@/hooks/usePets';
import { useTutores } from '@/hooks/useTutores';
import { useUnidades } from '@/hooks/useUnidades';
import { useServicos } from '@/hooks/useServicos';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pendente: 'bg-honey-light text-accent-foreground border-honey',
  confirmada: 'bg-mint-light text-secondary border-mint',
  checkin: 'bg-coral-light text-primary border-coral',
  hospedado: 'bg-secondary text-secondary-foreground border-secondary',
  checkout: 'bg-honey text-accent-foreground border-honey',
  finalizada: 'bg-muted text-muted-foreground border-muted',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/30',
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

export default function Reservas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState('');

  const { data: reservas = [], isLoading } = useReservas();
  const { data: pets = [] } = usePets();
  const { data: tutores = [] } = useTutores();
  const { data: unidades = [] } = useUnidades();
  const { data: servicos = [] } = useServicos();
  const createReserva = useCreateReserva();
  const updateStatus = useUpdateReservaStatus();

  const getPet = (petId: string) => pets.find(p => p.id === petId);
  const getTutor = (tutorId: string) => tutores.find(t => t.id === tutorId);
  const getUnidade = (unidadeId: string) => unidades.find(u => u.id === unidadeId);
  const getServico = (servicoId: string) => servicos.find(s => s.id === servicoId);

  const tutorPets = pets.filter(p => p.tutor_id === selectedTutor);

  const filteredReservas = reservas.filter(reserva => {
    const pet = getPet(reserva.pet_id);
    const tutor = getTutor(reserva.tutor_id);
    
    const matchSearch = 
      pet?.nome.toLowerCase().includes(search.toLowerCase()) ||
      tutor?.nome.toLowerCase().includes(search.toLowerCase()) ||
      reserva.codigo_estadia?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || reserva.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const handleAddReserva = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createReserva.mutate({
      tutor_id: formData.get('tutor_id') as string,
      pet_id: formData.get('pet_id') as string,
      unidade_id: formData.get('unidade_id') as string,
      check_in: formData.get('check_in') as string,
      check_out: formData.get('check_out') as string,
      servicos_adicionais: [],
      valor_total: parseFloat(formData.get('valor_total') as string) || 0,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedTutor('');
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reservas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {reservas.length} reservas no sistema
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedTutor(''); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Nova Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Reserva</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddReserva} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="tutor_id">Tutor</Label>
                  <Select name="tutor_id" required onValueChange={setSelectedTutor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {tutores.map(tutor => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pet_id">Pet</Label>
                  <Select name="pet_id" required disabled={!selectedTutor}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTutor ? "Selecione o pet" : "Selecione o tutor primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tutorPets.map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.especie === 'cachorro' ? '🐶' : '🐱'} {pet.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_id">Unidade</Label>
                  <Select name="unidade_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map(unidade => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="check_in">Check-in</Label>
                    <Input id="check_in" name="check_in" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="check_out">Check-out</Label>
                    <Input id="check_out" name="check_out" type="date" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor total (R$)</Label>
                  <Input id="valor_total" name="valor_total" type="number" step="0.01" placeholder="100.00" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createReserva.isPending}>
                    {createReserva.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Reserva'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por pet, tutor ou código..."
              className="pl-12 h-12 rounded-xl w-full"
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredReservas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma reserva encontrada</p>
          </div>
        ) : (
          /* Reservas List */
          <div className="space-y-4">
            {filteredReservas.map((reserva, index) => {
              const pet = getPet(reserva.pet_id);
              const tutor = getTutor(reserva.tutor_id);
              const unidade = getUnidade(reserva.unidade_id);
              
              return (
                <div 
                  key={reserva.id}
                  className="bg-card rounded-2xl p-4 md:p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up cursor-pointer group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    {/* Pet Avatar */}
                    <div className={cn(
                      "w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0",
                      pet?.especie === 'cachorro' ? 'bg-coral-light' : 'bg-mint-light'
                    )}>
                      {pet?.especie === 'cachorro' ? '🐶' : '🐱'}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h3 className="text-base md:text-lg font-bold text-foreground">{pet?.nome || 'Pet não encontrado'}</h3>
                        <Select 
                          value={reserva.status} 
                          onValueChange={(value) => updateStatus.mutate({ id: reserva.id, status: value as any })}
                        >
                          <SelectTrigger className={cn("w-auto h-7 border text-xs", statusColors[reserva.status])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="confirmada">Confirmada</SelectItem>
                            <SelectItem value="checkin">Check-in</SelectItem>
                            <SelectItem value="hospedado">Hospedado</SelectItem>
                            <SelectItem value="checkout">Check-out</SelectItem>
                            <SelectItem value="finalizada">Finalizada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        {reserva.codigo_estadia && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {reserva.codigo_estadia}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Tutor: {tutor?.nome || 'N/A'} • {unidade?.nome || 'N/A'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          <span className="text-foreground font-medium">
                            {new Date(reserva.check_in).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-foreground font-medium">
                            {new Date(reserva.check_out).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      {reserva.servicos_adicionais && reserva.servicos_adicionais.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {reserva.servicos_adicionais.map(servicoId => {
                            const servico = getServico(servicoId);
                            return servico ? (
                              <Badge key={servicoId} variant="secondary" className="text-xs">
                                {servico.nome}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Price & Action */}
                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-foreground">
                          R$ {Number(reserva.valor_total || 0).toFixed(2)}
                        </p>
                        <Badge 
                          variant={reserva.pagamento_status === 'aprovado' ? 'default' : 'secondary'}
                          className={cn(
                            "text-xs mt-1",
                            reserva.pagamento_status === 'aprovado' 
                              ? 'bg-secondary text-secondary-foreground' 
                              : 'bg-honey-light text-accent-foreground'
                          )}
                        >
                          {reserva.pagamento_status === 'aprovado' ? '✓ Pago' : '⏳ Pendente'}
                        </Badge>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}