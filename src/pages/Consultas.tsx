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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Search, ChevronRight, Loader2, Stethoscope, Trash2, Edit } from 'lucide-react';
import { useConsultas, useCreateConsulta, useUpdateConsultaStatus, useDeleteConsulta, useUpdateConsulta } from '@/hooks/useConsultas';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Consulta } from '@/types';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  agendada: 'bg-honey-light text-accent-foreground border-honey',
  confirmada: 'bg-mint-light text-secondary border-mint',
  realizada: 'bg-coral-light text-primary border-coral',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/30',
  reagendada: 'bg-blush-light text-blush border-blush',
};

// Função para formatar data ignorando fuso horário para exibição correta
const formatLocalTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch (e) {
    return 'Data inválida';
  }
};

// Componente para o formulário de edição/criação
function ConsultaForm({ 
  consulta,
  dentistas, 
  pacientes, 
  onSubmit,
  onCancel,
  isPending
}: any) {
  const [selectedPacienteId, setSelectedPacienteId] = useState(consulta?.paciente_id || '');
  const [selectedDentistaId, setSelectedDentistaId] = useState(consulta?.dentista_id || '');

  // Formata a data para o input datetime-local (YYYY-MM-DDTHH:mm)
  const formatForInput = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
        paciente_id: selectedPacienteId,
        dentista_id: selectedDentistaId,
        data_hora_inicio: new Date(formData.get('data_hora_inicio') as string).toISOString(),
        data_hora_fim: new Date(formData.get('data_hora_fim') as string).toISOString(),
        valor_total: parseFloat((formData.get('valor_total') as string).replace(',', '.')) || 0,
      };
      onSubmit(data);
    }} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Paciente</Label>
        <Select 
          value={selectedPacienteId}
          onValueChange={setSelectedPacienteId}
          disabled={!!consulta} // Não permite trocar paciente na edição para evitar erros de histórico
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o paciente" />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Dentista</Label>
        <Select 
          value={selectedDentistaId}
          onValueChange={setSelectedDentistaId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o dentista" />
          </SelectTrigger>
          <SelectContent>
            {dentistas.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>
                <Stethoscope className="w-4 h-4 inline-block mr-2" /> {d.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_hora_inicio">Início</Label>
          <Input 
            id="data_hora_inicio" 
            name="data_hora_inicio" 
            type="datetime-local" 
            required 
            defaultValue={formatForInput(consulta?.data_hora_inicio)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_hora_fim">Fim</Label>
          <Input 
            id="data_hora_fim" 
            name="data_hora_fim" 
            type="datetime-local" 
            required 
            defaultValue={formatForInput(consulta?.data_hora_fim)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor_total">Valor (R$)</Label>
        <Input 
          id="valor_total" 
          name="valor_total" 
          type="text" 
          inputMode="decimal" 
          placeholder="0,00" 
          defaultValue={consulta?.valor_total?.toFixed(2).replace('.', ',')}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (consulta ? 'Salvar Alterações' : 'Criar Consulta')}
        </Button>
      </div>
    </form>
  );
}

export default function Consultas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);

  const { data: consultas = [], isLoading } = useConsultas();
  const { data: dentistas = [] } = useDentistas();
  const { data: pacientes = [] } = usePacientes();
  const { data: clinicas = [] } = useClinicas();
  
  const createConsulta = useCreateConsulta();
  const updateConsulta = useUpdateConsulta();
  const updateStatus = useUpdateConsultaStatus();
  const deleteConsulta = useDeleteConsulta();

  const getDentista = (id: string) => dentistas.find(d => d.id === id);
  const getPaciente = (id: string) => pacientes.find(p => p.id === id);

  const filteredConsultas = consultas.filter(c => {
    const d = getDentista(c.dentista_id);
    const p = getPaciente(c.paciente_id);
    const matchSearch = d?.nome.toLowerCase().includes(search.toLowerCase()) || 
                        p?.nome.toLowerCase().includes(search.toLowerCase()) ||
                        c.codigo_consulta?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consultas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">{consultas.length} agendamentos</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full md:w-auto"><Plus className="w-5 h-5 mr-2" /> Nova Consulta</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
              <ConsultaForm 
                dentistas={dentistas}
                pacientes={pacientes}
                isPending={createConsulta.isPending}
                onCancel={() => setIsCreateDialogOpen(false)}
                onSubmit={(data: any) => {
                  if (clinicas.length === 0) return toast.error("Cadastre uma clínica primeiro!");
                  createConsulta.mutate({ ...data, clinica_id: clinicas[0].id }, {
                    onSuccess: () => setIsCreateDialogOpen(false)
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="pl-12 h-12 rounded-xl" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="realizada">Realizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {filteredConsultas.map((consulta, idx) => {
              const d = getDentista(consulta.dentista_id);
              const p = getPaciente(consulta.paciente_id);
              return (
                <div key={consulta.id} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 hover:shadow-elevated transition-all animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-2xl">🦷</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{p?.nome || 'Paciente'}</h3>
                        <Select value={consulta.status} onValueChange={(val) => updateStatus.mutate({ id: consulta.id, status: val as any })}>
                          <SelectTrigger className={cn("w-auto h-7 text-[10px] uppercase font-bold", statusColors[consulta.status])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agendada">Agendada</SelectItem>
                            <SelectItem value="confirmada">Confirmada</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground">Dr(a). {d?.nome || 'N/A'}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm font-medium text-primary">
                        <Calendar size={14} /> {formatLocalTime(consulta.data_hora_inicio)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold">R$ {consulta.valor_total.toFixed(2)}</p>
                        <div className="flex gap-2 justify-end mt-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setEditingConsulta(consulta)}>
                            <Edit size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                            if (confirm("Excluir esta consulta?")) deleteConsulta.mutate(consulta.id);
                          }}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Diálogo de Edição */}
        <Dialog open={!!editingConsulta} onOpenChange={(open) => !open && setEditingConsulta(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Editar Consulta</DialogTitle></DialogHeader>
            {editingConsulta && (
              <ConsultaForm 
                consulta={editingConsulta}
                dentistas={dentistas}
                pacientes={pacientes}
                isPending={updateConsulta.isPending}
                onCancel={() => setEditingConsulta(null)}
                onSubmit={(data: any) => {
                  updateConsulta.mutate({ id: editingConsulta.id, ...data }, {
                    onSuccess: () => setEditingConsulta(null)
                  });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}