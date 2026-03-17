import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Search, ChevronRight, Loader2, Stethoscope, Trash2, Edit, User, Download, CheckCircle2, Clock4 } from 'lucide-react';
import { useConsultas, useCreateConsulta, useUpdateConsultaStatus, useDeleteConsulta, useUpdateConsulta } from '@/hooks/useConsultas';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
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

const pagamentoColors: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700 border-amber-200',
  pago: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelado: 'bg-gray-100 text-gray-500 border-gray-200',
};

const pagamentoLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getLocalDate = (isoString: string): string => toLocalDateStr(new Date(isoString));

const formatLocalTime = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return 'Data inválida';
  }
};

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
  const [patientSearch, setPatientSearch] = useState('');

  const filteredPacientes = useMemo(() => {
    return pacientes.filter((p: any) =>
      p.nome.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.cpf.includes(patientSearch)
    );
  }, [pacientes, patientSearch]);

  const formatForInput = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!selectedPacienteId) { toast.error('Selecione um paciente.'); return; }
      if (!selectedDentistaId) { toast.error('Selecione um dentista.'); return; }
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
        {!consulta && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou CPF..."
              className="pl-9 h-9 text-sm"
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
            />
          </div>
        )}
        <Select value={selectedPacienteId} onValueChange={setSelectedPacienteId} disabled={!!consulta}>
          <SelectTrigger>
            <SelectValue placeholder={patientSearch ? `${filteredPacientes.length} resultado(s)` : "Selecione o paciente"} />
          </SelectTrigger>
          <SelectContent>
            {filteredPacientes.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <span>{p.nome}</span>
                  {p.is_menor_idade && <Badge variant="outline" className="text-[8px] h-3 px-1">MENOR</Badge>}
                  {p.is_menor_idade && p.responsavel_nome && (
                    <span className="text-[10px] text-amber-600">(Resp: {p.responsavel_nome})</span>
                  )}
                </div>
              </SelectItem>
            ))}
            {filteredPacientes.length === 0 && (
              <div className="p-2 text-xs text-center text-muted-foreground">Nenhum paciente encontrado</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Dentista</Label>
        <Select value={selectedDentistaId} onValueChange={setSelectedDentistaId}>
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
          <Input id="data_hora_inicio" name="data_hora_inicio" type="datetime-local" required defaultValue={formatForInput(consulta?.data_hora_inicio)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_hora_fim">Fim</Label>
          <Input id="data_hora_fim" name="data_hora_fim" type="datetime-local" required defaultValue={formatForInput(consulta?.data_hora_fim)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor_total">Valor (R$)</Label>
        <Input id="valor_total" name="valor_total" type="text" inputMode="decimal" placeholder="0,00" defaultValue={consulta?.valor_total?.toFixed(2).replace('.', ',')} />
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

// Export CSV helper
const exportToCSV = (consultas: Consulta[], dentistas: any[], pacientes: any[]) => {
  const getDentista = (id: string) => dentistas.find(d => d.id === id);
  const getPaciente = (id: string) => pacientes.find(p => p.id === id);

  const header = ['Código', 'Paciente', 'Dentista', 'Data/Hora', 'Status', 'Pagamento', 'Valor (R$)'];
  const rows = consultas.map(c => [
    c.codigo_consulta || '',
    getPaciente(c.paciente_id)?.nome || '',
    getDentista(c.dentista_id)?.nome || '',
    formatLocalTime(c.data_hora_inicio),
    c.status,
    c.pagamento_status || '',
    c.valor_total?.toFixed(2).replace('.', ',') || '0,00',
  ]);

  const csvContent = [header, ...rows].map(row => row.map(v => `"${v}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `consultas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Arquivo CSV exportado!');
};

export default function Consultas() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [dentistaFilter, setDentistaFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('todos');
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

  const hoje = toLocalDateStr(new Date());
  const amanha = toLocalDateStr(addDays(new Date(), 1));
  const inicioSemana = toLocalDateStr(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const fimSemana = toLocalDateStr(endOfWeek(new Date(), { weekStartsOn: 1 }));
  const inicioMes = toLocalDateStr(startOfMonth(new Date()));
  const fimMes = toLocalDateStr(endOfMonth(new Date()));

  const filteredConsultas = useMemo(() => {
    return consultas.filter(c => {
      const d = getDentista(c.dentista_id);
      const p = getPaciente(c.paciente_id);
      const localDate = getLocalDate(c.data_hora_inicio);

      const matchSearch =
        d?.nome.toLowerCase().includes(search.toLowerCase()) ||
        p?.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.codigo_consulta?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'todos' || c.status === statusFilter;
      const matchDentista = dentistaFilter === 'todos' || c.dentista_id === dentistaFilter;

      let matchDate = true;
      if (dateFilter === 'hoje') matchDate = localDate === hoje;
      else if (dateFilter === 'amanha') matchDate = localDate === amanha;
      else if (dateFilter === 'semana') matchDate = localDate >= inicioSemana && localDate <= fimSemana;
      else if (dateFilter === 'mes') matchDate = localDate >= inicioMes && localDate <= fimMes;

      return matchSearch && matchStatus && matchDentista && matchDate;
    });
  }, [consultas, search, statusFilter, dentistaFilter, dateFilter, hoje, amanha, inicioSemana, fimSemana, inicioMes, fimMes]);

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Consultas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {filteredConsultas.length} de {consultas.length} agendamentos
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => exportToCSV(filteredConsultas, dentistas, pacientes)}
              disabled={filteredConsultas.length === 0}
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg"><Plus className="w-5 h-5 mr-2" /> Nova Consulta</Button>
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
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3">
          {/* Linha 1: Busca + Status */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, dentista ou código..."
                className="pl-12 h-12 rounded-xl"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-44 h-12 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
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
          {/* Linha 2: Dentista + Data */}
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={dentistaFilter} onValueChange={setDentistaFilter}>
              <SelectTrigger className="w-full md:w-56 h-12 rounded-xl">
                <Stethoscope className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Dentista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os dentistas</SelectItem>
                {dentistas.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-44 h-12 rounded-xl">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="amanha">Amanhã</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : filteredConsultas.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
            <div className="text-4xl mb-3">🦷</div>
            <p className="text-muted-foreground font-medium">Nenhuma consulta encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros ou crie uma nova consulta.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultas.map((consulta, idx) => {
              const d = getDentista(consulta.dentista_id);
              const p = getPaciente(consulta.paciente_id);
              const pagStatus = (consulta as any).pagamento_status as string || 'pendente';
              return (
                <div
                  key={consulta.id}
                  className="bg-card rounded-2xl p-5 shadow-card border border-border/50 hover:shadow-elevated transition-all animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-2xl">🦷</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg leading-tight">{p?.nome || 'Paciente'}</h3>
                        {p?.is_menor_idade && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-amber-50 text-amber-600 border-amber-200">MENOR</Badge>
                        )}
                        <Select value={consulta.status} onValueChange={(val) => updateStatus.mutate({ id: consulta.id, status: val as any })}>
                          <SelectTrigger className={cn("w-auto h-6 text-[9px] uppercase font-bold px-2", statusColors[consulta.status])}>
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
                        <Badge className={cn("text-[9px] h-6 px-2 border", pagamentoColors[pagStatus])}>
                          {pagStatus === 'pago' ? <CheckCircle2 size={10} className="mr-1 inline" /> : <Clock4 size={10} className="mr-1 inline" />}
                          {pagamentoLabels[pagStatus] || pagStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Dr(a). {d?.nome || 'N/A'}</p>
                      {p?.is_menor_idade && p?.responsavel_nome && (
                        <p className="text-xs text-amber-600 mt-0.5">Responsável: {p.responsavel_nome}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm font-medium text-primary">
                        <Calendar size={14} /> {formatLocalTime(consulta.data_hora_inicio)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-bold">R$ {consulta.valor_total?.toFixed(2) || '0,00'}</p>
                        {consulta.codigo_consulta && (
                          <p className="text-[10px] text-muted-foreground font-mono">{consulta.codigo_consulta}</p>
                        )}
                        <div className="flex gap-2 justify-end mt-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setEditingConsulta(consulta)}>
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            disabled={deleteConsulta.isPending}
                            onClick={() => { if (confirm("Excluir esta consulta?")) deleteConsulta.mutate(consulta.id); }}
                          >
                            {deleteConsulta.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                          </Button>
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground hidden sm:block" />
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
