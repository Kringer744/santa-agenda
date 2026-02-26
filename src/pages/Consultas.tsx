import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Search, ChevronRight, Loader2, Stethoscope, Trash2, Edit } from 'lucide-react';
import { useConsultas, useCreateConsulta, useUpdateConsultaStatus, useDeleteConsulta, useUpdateConsultaValue } from '@/hooks/useConsultas';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Consulta } from '@/types';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  agendada: 'bg-honey-light text-accent-foreground border-honey',
  confirmada: 'bg-mint-light text-secondary border-mint',
  realizada: 'bg-coral-light text-primary border-coral',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/30',
  reagendada: 'bg-blush-light text-blush border-blush',
};

// Componente auxiliar para o formulário de nova consulta
function NewConsultaForm({ 
  dentistas, 
  pacientes, 
  clinicas, 
  createConsulta, 
  createPaciente, 
  onSuccess 
}: any) {
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [newPacienteData, setNewPacienteData] = useState({ nome: '', cpf: '', telefone: '' });

  const handleCreateNewPatient = async () => {
    if (!newPacienteData.nome || !newPacienteData.cpf || !newPacienteData.telefone) {
      toast.error('Preencha nome, CPF e telefone para cadastrar o paciente.');
      return null;
    }
    try {
      const newPaciente = await createPaciente.mutateAsync({
        nome: newPacienteData.nome,
        cpf: newPacienteData.cpf.replace(/\D/g, ''),
        telefone: newPacienteData.telefone.replace(/\D/g, ''),
        email: null,
        data_nascimento: null,
        tags: ['novo'],
        observacoes: null,
      });
      setSelectedPacienteId(newPaciente.id);
      setIsNewPatient(false);
      return newPaciente.id;
    } catch (error: any) {
      toast.error(`Erro ao cadastrar paciente: ${error.message}`);
      return null;
    }
  };

  const handleAddConsulta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (clinicas.length === 0) return;

    let pacienteId = selectedPacienteId;

    if (isNewPatient) {
      pacienteId = await handleCreateNewPatient();
      if (!pacienteId) return;
    }

    if (!pacienteId) {
      toast.error('Selecione ou cadastre um paciente.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const valorTotalString = (formData.get('valor_total') as string).replace(',', '.');
    const valorTotal = parseFloat(valorTotalString);

    if (isNaN(valorTotal)) {
      toast.error('O valor total inserido é inválido.');
      return;
    }

    createConsulta.mutate({
      paciente_id: pacienteId,
      dentista_id: formData.get('dentista_id') as string,
      clinica_id: clinicas[0].id, 
      data_hora_inicio: formData.get('data_hora_inicio') as string,
      data_hora_fim: formData.get('data_hora_fim') as string,
      procedimentos: [],
      valor_total: valorTotal,
      urgencia: false,
      pix_txid: null,
      pix_qr_code_base64: null,
      pix_copia_e_cola: null,
    }, {
      onSuccess: onSuccess
    });
  };

  return (
    <form onSubmit={handleAddConsulta} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="paciente_id">Paciente</Label>
        <div className="flex items-center gap-2">
          <Select 
            name="paciente_id" 
            required 
            value={selectedPacienteId}
            onValueChange={setSelectedPacienteId}
            disabled={isNewPatient}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              {pacientes.map((paciente: any) => (
                <SelectItem key={paciente.id} value={paciente.id}>
                  {paciente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsNewPatient(!isNewPatient);
              setSelectedPacienteId('');
            }}
          >
            {isNewPatient ? 'Selecionar Existente' : 'Novo Paciente'}
          </Button>
        </div>
      </div>

      {isNewPatient && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <h4 className="font-semibold text-sm">Cadastrar Novo Paciente</h4>
          <Input 
            placeholder="Nome" 
            required={isNewPatient} 
            value={newPacienteData.nome}
            onChange={e => setNewPacienteData(p => ({ ...p, nome: e.target.value }))}
          />
          <Input 
            placeholder="CPF" 
            required={isNewPatient} 
            value={newPacienteData.cpf}
            onChange={e => setNewPacienteData(p => ({ ...p, cpf: e.target.value }))}
          />
          <Input 
            placeholder="Telefone (WhatsApp)" 
            required={isNewPatient} 
            value={newPacienteData.telefone}
            onChange={e => setNewPacienteData(p => ({ ...p, telefone: e.target.value }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dentista_id">Dentista</Label>
        <Select name="dentista_id" required disabled={!selectedPacienteId && !isNewPatient}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o dentista" />
          </SelectTrigger>
          <SelectContent>
            {dentistas.map((dentista: any) => (
              <SelectItem key={dentista.id} value={dentista.id}>
                <Stethoscope className="w-4 h-4 inline-block mr-2" /> {dentista.nome}
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
        <Input id="valor_total" name="valor_total" type="text" inputMode="decimal" placeholder="100,00" />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={createConsulta.isPending || clinicas.length === 0 || (isNewPatient && createPaciente.isPending)}>
          {createConsulta.isPending || createPaciente.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Consulta'}
        </Button>
      </div>
    </form>
  );
}

// Componente auxiliar para edição de preço
function EditValueDialog({ consulta, updateConsultaValue, isOpen, setIsOpen }: { consulta: Consulta, updateConsultaValue: any, isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  const [newValue, setNewValue] = useState(consulta.valor_total.toFixed(2).replace('.', ','));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedValue = newValue.replace(',', '.');
    const parsedValue = parseFloat(sanitizedValue);

    if (isNaN(parsedValue)) {
      toast.error('Valor inválido.');
      return;
    }

    updateConsultaValue.mutate({
      id: consulta.id,
      valor_total: parsedValue
    }, {
      onSuccess: () => setIsOpen(false)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Editar Valor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_valor">Novo Valor (R$)</Label>
            <Input 
              id="edit_valor" 
              type="text"
              inputMode="decimal"
              value={newValue} 
              onChange={e => setNewValue(e.target.value)} 
              required 
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateConsultaValue.isPending}>
              {updateConsultaValue.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function Consultas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditValueDialogOpen, setIsEditValueDialogOpen] = useState(false);
  const [selectedConsultaToEdit, setSelectedConsultaToEdit] = useState<Consulta | null>(null);

  const { data: consultas = [], isLoading } = useConsultas();
  const { data: dentistas = [] } = useDentistas();
  const { data: pacientes = [] } = usePacientes();
  const { data: clinicas = [] } = useClinicas();
  const createConsulta = useCreateConsulta();
  const createPaciente = useCreatePaciente(); // Novo hook
  const updateStatus = useUpdateConsultaStatus();
  const deleteConsulta = useDeleteConsulta(); // Novo hook
  const updateConsultaValue = useUpdateConsultaValue(); // Novo hook

  const getDentista = (dentistaId: string) => dentistas.find(d => d.id === dentistaId);
  const getPaciente = (pacienteId: string) => pacientes.find(p => p.id === pacienteId);

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

  const handleOpenEditValueDialog = (consulta: Consulta) => {
    setSelectedConsultaToEdit(consulta);
    setIsEditValueDialogOpen(true);
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
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Consulta</DialogTitle>
              </DialogHeader>
              <NewConsultaForm 
                dentistas={dentistas}
                pacientes={pacientes}
                clinicas={clinicas}
                createConsulta={createConsulta}
                createPaciente={createPaciente}
                onSuccess={() => setIsCreateDialogOpen(false)}
              />
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
              
              return (
                <div 
                  key={consulta.id}
                  className="bg-card rounded-2xl p-4 md:p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up group"
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
                      </div>
                      
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Dentista: {dentista?.nome || 'N/A'}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          <span className="text-foreground font-medium">
                            {format(new Date(consulta.data_hora_inicio), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <div className="text-right">
                        <p className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                          R$ {Number(consulta.valor_total || 0).toFixed(2)}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEditValueDialog(consulta)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </p>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteConsulta.mutate(consulta.id)}
                          disabled={deleteConsulta.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {selectedConsultaToEdit && (
          <EditValueDialog 
            consulta={selectedConsultaToEdit}
            updateConsultaValue={updateConsultaValue}
            isOpen={isEditValueDialogOpen}
            setIsOpen={setIsEditValueDialogOpen}
          />
        )}
      </div>
    </Layout>
  );
}