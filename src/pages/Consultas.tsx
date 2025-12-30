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
import { Calendar, Plus, Search, ChevronRight, Loader2, Smile, Stethoscope } from 'lucide-react'; // Replaced Tooth with Smile
import { useConsultas, useCreateConsulta, useUpdateConsultaStatus } from '@/hooks/useConsultas';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useProcedimentos } from '@/hooks/useProcedimentos';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  agendada: 'bg-honey-light text-accent-foreground border-honey',
  confirmada: 'bg-mint-light text-secondary border-mint',
  realizada: 'bg-coral-light text-primary border-coral',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/30',
  reagendada: 'bg-blush-light text-blush border-blush',
};

const statusLabels: Record<string, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
};

export default function Consultas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState('');

  const { data: consultas = [], isLoading } = useConsultas();
  const { data: dentistas = [] } = useDentistas();
  const { data: pacientes = [] } = usePacientes();
  const { data: clinicas = [] } = useClinicas();
  const { data: procedimentos = [] } = useProcedimentos();
  const createConsulta = useCreateConsulta();
  const updateStatus = useUpdateConsultaStatus();

  const getDentista = (dentistaId: string) => dentistas.find(d => d.id === dentistaId);
  const getPaciente = (pacienteId: string) => pacientes.find(p => p.id === pacienteId);
  const getClinica = (clinicaId: string) => clinicas.find(c => c.id === clinicaId);
  const getProcedimento = (procedimentoId: string) => procedimentos.find(p => p.id === procedimentoId);

  const pacienteDentistas = dentistas;

  const filteredConsultas = consultas.filter(consulta => {
    const dentista = getDentista(consulta.dentista_id);
    const paciente = getPaciente(consulta.paciente_id);
    
    const matchSearch = 
      dentista?.nome.toLowerCase().includes(search.toLowerCase()) ||
      paciente?.nome.toLowerCase().includes(search.toLowerCase()) ||
      consulta.codigo_consulta?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = statusFilter === 'todos' || consulta.status === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const handleAddConsulta = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createConsulta.mutate({
      paciente_id: formData.get('paciente_id') as string,
      dentista_id: formData.get('dentista_id') as string,
      clinica_id: formData.get('clinica_id') as string,
      data_hora_inicio: formData.get('data_hora_inicio') as string,
      data_hora_fim: formData.get('data_hora_fim') as string,
      procedimentos: [],
      valor_total: parseFloat(formData.get('valor_total') as string) || 0,
      pix_txid: null,
      pix_qr_code_base64: null,
      pix_copia_e_cola: null,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedPaciente('');
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consultas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {consultas.length} consultas no sistema
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedPaciente(''); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Consulta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddConsulta} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente_id">Paciente</Label>
                  <Select name="paciente_id" required onValueChange={setSelectedPaciente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map(paciente => (
                        <SelectItem key={paciente.id} value={paciente.id}>
                          {paciente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentista_id">Dentista</Label>
                  <Select name="dentista_id" required disabled={!selectedPaciente}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPaciente ? "Selecione o dentista" : "Selecione o paciente primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {pacienteDentistas.map(dentista => (
                        <SelectItem key={dentista.id} value={dentista.id}>
                          <Stethoscope className="w-4 h-4 inline-block mr-2" /> {dentista.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinica_id">Clínica</Label>
                  <Select name="clinica_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinicas.map(clinica => (
                        <SelectItem key={clinica.id} value={clinica.id}>
                          {clinica.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_hora_inicio">Data e Hora Início</Label>
                    <Input id="data_hora_inicio" name="data_hora_inicio" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_hora_fim">Data e Hora Fim</Label>
                    <Input id="data_hora_fim" name="data_hora_fim" type="datetime-local" required />
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
                  <Button type="submit" className="flex-1" disabled={createConsulta.isPending}>
                    {createConsulta.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Consulta'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por paciente, dentista ou código..."
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
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="realizada">Realizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="reagendada">Reagendada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredConsultas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma consulta encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultas.map((consulta, index) => {
              const dentista = getDentista(consulta.dentista_id);
              const paciente = getPaciente(consulta.paciente_id);
              const clinica = getClinica(consulta.clinica_id);
              
              return (
                <div 
                  key={consulta.id}
                  className="bg-card rounded-2xl p-4 md:p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up cursor-pointer group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                    <div className={cn(
                      "w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0",
                      dentista?.especialidade === 'ortodontia' ? 'bg-mint-light' : 'bg-coral-light'
                    )}>
                      🦷
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h3 className="text-base md:text-lg font-bold text-foreground">{paciente?.nome || 'Paciente não encontrado'}</h3>
                        <Select 
                          value={consulta.status} 
                          onValueChange={(value) => updateStatus.mutate({ id: consulta.id, status: value as any })}
                        >
                          <SelectTrigger className={cn("w-auto h-7 border text-xs", statusColors[consulta.status])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agendada">Agendada</SelectItem>
                            <SelectItem value="confirmada">Confirmada</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                            <SelectItem value="reagendada">Reagendada</SelectItem>
                          </SelectContent>
                        </Select>
                        {consulta.codigo_consulta && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {consulta.codigo_consulta}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Dentista: {dentista?.nome || 'N/A'} • {clinica?.nome || 'N/A'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          <span className="text-foreground font-medium">
                            {format(new Date(consulta.data_hora_inicio), 'dd/MM/yyyy HH:mm')}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-foreground font-medium">
                            {format(new Date(consulta.data_hora_fim), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                      
                      {consulta.procedimentos && consulta.procedimentos.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {consulta.procedimentos.map(procedimentoId => {
                            const procedimento = getProcedimento(procedimentoId);
                            return procedimento ? (
                              <Badge key={procedimentoId} variant="secondary" className="text-xs">
                                {procedimento.nome}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-foreground">
                          R$ {Number(consulta.valor_total || 0).toFixed(2)}
                        </p>
                        <Badge 
                          variant={consulta.pagamento_status === 'aprovado' ? 'default' : 'secondary'}
                          className={cn(
                            "text-xs mt-1",
                            consulta.pagamento_status === 'aprovado' 
                              ? 'bg-secondary text-secondary-foreground' 
                              : 'bg-honey-light text-accent-foreground'
                          )}
                        >
                          {consulta.pagamento_status === 'aprovado' ? '✓ Pago' : '⏳ Pendente'}
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