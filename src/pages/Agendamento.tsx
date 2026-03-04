import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Stethoscope, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useTodasAgendas, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista';
import { useCreateConsulta } from '@/hooks/useConsultas';
import { useProcedimentos } from '@/hooks/useProcedimentos';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendar';
import { format, addMinutes, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgendaDentista } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export default function Agendamento() {
  const [searchParams] = useSearchParams();
  const pacienteIdUrl = searchParams.get('paciente_id');
  
  const [step, setStep] = useState(pacienteIdUrl ? 2 : 1);
  const [selectedDentistaId, setSelectedDentistaId] = useState<string>('');
  const [selectedProcedimentoId, setSelectedProcedimentoId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isUrgency, setIsUrgency] = useState(false);
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [currentPacienteId, setCurrentPacienteId] = useState<string | null>(pacienteIdUrl);
  const [isCheckingPatient, setIsCheckingPatient] = useState(false);

  useEffect(() => {
    document.title = "Agendamento - DentalClinic";
  }, []);

  const { data: dentistas = [] } = useDentistas();
  const { data: clinicas = [] } = useClinicas();
  const { data: pacientes = [] } = usePacientes();
  const { data: procedimentos = [] } = useProcedimentos();
  const { data: todasAgendas = [] } = useTodasAgendas();
  const createConsulta = useCreateConsulta();
  const createPaciente = useCreatePaciente();
  const updateAgenda = useUpdateAgendaDentista();
  const googleCalendarSync = useGoogleCalendarSync();

  const selectedDentista = dentistas.find(d => d.id === selectedDentistaId);
  const selectedProcedimento = procedimentos.find(p => p.id === selectedProcedimentoId);

  const availableProcedimentos = useMemo(() => {
    if (!selectedDentista) return [];
    const ids = selectedDentista.procedimentos || [];
    return procedimentos.filter(p => ids.includes(p.id));
  }, [selectedDentista, procedimentos]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedDentistaId) return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const agenda = todasAgendas.find((a: AgendaDentista) => a.dentista_id === selectedDentistaId && a.data === dateStr);
    
    if (!agenda) return [];

    const now = new Date();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    const currentHourMin = format(now, 'HH:mm');

    return agenda.horarios_disponiveis.filter((slot: string) => {
      const isOccupied = agenda.horarios_ocupados.includes(slot);
      if (isOccupied) return false;
      if (isToday) return slot > currentHourMin;
      return true;
    });
  }, [selectedDate, selectedDentistaId, todasAgendas]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingPatient(true);
    try {
      if (!nome || !telefone || !cpf) {
        toast.error("Preencha os campos obrigatórios.");
        return;
      }
      const cleanedCpf = cpf.replace(/\D/g, '');
      const cleanedTelefone = telefone.replace(/\D/g, '');

      // Busca por CPF ou Telefone para evitar duplicidade
      const { data: existingPatients, error } = await supabase
        .from('pacientes')
        .select('id, nome')
        .or(`cpf.eq.${cleanedCpf},telefone.eq.${cleanedTelefone}`)
        .limit(1);

      if (error) throw error;

      if (existingPatients && existingPatients.length > 0) {
        toast.success(`Bem-vindo de volta, ${existingPatients[0].nome}!`);
        setCurrentPacienteId(existingPatients[0].id);
        setStep(2);
      } else {
        const newPaciente = await createPaciente.mutateAsync({ 
          nome, 
          telefone: cleanedTelefone, 
          cpf: cleanedCpf, 
          data_nascimento: dataNascimento || null,
          tags: ['cliente-web'], 
          email: null,
          observacoes: null,
          meses_retorno: 6,
          is_menor_idade: false,
          responsavel_nome: null,
          responsavel_telefone: null
        });
        setCurrentPacienteId(newPaciente.id);
        setStep(2);
      }
    } catch (err: any) { 
      toast.error(`Erro ao validar paciente: ${err.message}`); 
    } finally {
      setIsCheckingPatient(false);
    }
  };

  const handleBook = async () => {
    const paciente = pacientes.find(p => p.id === currentPacienteId);
    
    if (!currentPacienteId || !selectedDate || !selectedSlot || !selectedDentista || !selectedProcedimento) {
      toast.error("Por favor, selecione todos os campos.");
      return;
    }

    const startDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`);
    const endDateTime = addMinutes(startDateTime, 30);

    try {
      // 1. Cria a consulta (Isso já dispara o WhatsApp no hook useCreateConsulta)
      const consultaResult = await createConsulta.mutateAsync({
        paciente_id: currentPacienteId,
        dentista_id: selectedDentistaId,
        clinica_id: clinicas[0]?.id || '',
        data_hora_inicio: startDateTime.toISOString(),
        data_hora_fim: endDateTime.toISOString(),
        procedimentos: [selectedProcedimentoId],
        valor_total: selectedProcedimento.preco,
        urgencia: isUrgency,
        pix_txid: null,
        pix_qr_code_base64: null,
        pix_copia_e_cola: null,
      });

      // 2. Atualiza a agenda local do dentista
      const agendaDoDia = todasAgendas.find((a: AgendaDentista) => a.dentista_id === selectedDentistaId && a.data === format(selectedDate, 'yyyy-MM-dd'));
      if (agendaDoDia) {
        const newHorariosOcupados = [...agendaDoDia.horarios_ocupados, selectedSlot].sort();
        await updateAgenda.mutateAsync({ id: agendaDoDia.id, horarios_ocupados: newHorariosOcupados });
      }

      // 3. Sincroniza com Google Calendar
      if (selectedDentista.google_calendar_id) {
        await googleCalendarSync.mutateAsync({
          action: 'createEvent',
          calendarId: selectedDentista.google_calendar_id,
          eventData: {
            summary: `${selectedProcedimento.nome}: ${paciente?.nome || 'Paciente'}`,
            description: `Procedimento: ${selectedProcedimento.nome}\nValor: R$ ${selectedProcedimento.preco}\nCódigo: ${consultaResult.codigo_consulta}`,
            start: { dateTime: startDateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
            end: { dateTime: endDateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
          }
        });
      }

      setStep(5);
    } catch (err: any) { 
      toast.error(`Erro ao finalizar agendamento: ${err.message}`); 
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 gradient-dental rounded-xl flex items-center justify-center shadow-soft text-white">
          <Stethoscope size={28} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">DentalClinic</h1>
      </div>

      <Card className="w-full max-w-lg shadow-elevated border-border/50">
        <CardHeader className="text-center border-b pb-6 bg-muted/20">
          <CardTitle className="text-xl">Agendamento Online</CardTitle>
          <CardDescription>Reserve seu horário em segundos</CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Seu nome" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} required placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={cpf} onChange={e => setCpf(e.target.value)} required placeholder="000.000.000-00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento (Opcional)</Label>
                <Input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-12 bg-primary" disabled={isCheckingPatient}>
                {isCheckingPatient ? <Loader2 className="animate-spin" /> : 'Próximo Passo'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label className="text-base font-bold">1. Escolha o Dentista</Label>
                <div className="grid grid-cols-1 gap-3">
                  {dentistas.map(d => (
                    <button 
                      key={d.id} 
                      onClick={() => { setSelectedDentistaId(d.id); setSelectedProcedimentoId(''); setStep(3); }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-primary",
                        selectedDentistaId === d.id && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {d.nome.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{d.nome}</p>
                        <p className="text-xs text-muted-foreground">{d.especialidade || 'Clínico Geral'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-muted-foreground">
                <ChevronLeft size={16} className="mr-1" /> Escolher outro dentista
              </Button>
              <div className="space-y-3">
                <Label className="text-base font-bold">2. Qual serviço você deseja?</Label>
                <div className="grid grid-cols-1 gap-3">
                  {availableProcedimentos.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { setSelectedProcedimentoId(p.id); setStep(4); }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border text-left transition-all hover:border-primary",
                        selectedProcedimentoId === p.id && "border-primary bg-primary/5 ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.icone}</span>
                        <div>
                          <p className="font-bold">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">Procedimento Profissional</p>
                        </div>
                      </div>
                      <p className="font-bold text-primary">R$ {p.preco.toFixed(2)}</p>
                    </button>
                  ))}
                  {availableProcedimentos.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Este dentista não tem serviços vinculados.</p>
                      <Button variant="link" onClick={() => setStep(2)}>Voltar</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-muted-foreground">
                <ChevronLeft size={16} className="mr-1" /> Mudar serviço
              </Button>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
                  <div className="space-y-0.5">
                    <Label className="text-red-900 font-bold flex items-center gap-2">
                      <AlertCircle size={18} />
                      É uma Urgência?
                    </Label>
                    <p className="text-xs text-red-700">A secretária entrará em contato para um encaixe prioritário.</p>
                  </div>
                  <Switch
                    checked={isUrgency}
                    onCheckedChange={setIsUrgency}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>

                <Label className="text-base font-bold">3. Escolha o Melhor Horário</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="mx-auto rounded-xl border shadow-sm"
                  disabled={(date) => date < startOfDay(new Date())}
                />
                
                {selectedDate && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {availableSlots.map((slot: string) => (
                      <Button 
                        key={slot} 
                        variant={selectedSlot === slot ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot)}
                        className="h-10"
                      >
                        {slot}
                      </Button>
                    ))}
                    {availableSlots.length === 0 && <p className="text-xs text-center col-span-3 py-4 text-muted-foreground">Sem horários para este dia.</p>}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t flex flex-col gap-3">
                <div className="flex justify-between text-sm font-bold bg-muted/50 p-3 rounded-lg">
                  <span>Total do Serviço:</span>
                  <span className="text-primary">R$ {selectedProcedimento?.preco.toFixed(2)}</span>
                </div>
                <Button className="w-full h-12" disabled={!selectedSlot || createConsulta.isPending} onClick={handleBook}>
                  {createConsulta.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 text-center animate-fade-in py-10">
              <div className="bg-emerald-100 p-6 rounded-full inline-block">
                <CheckCircle className="text-emerald-600 w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold">Agendamento Confirmado!</h3>
              <p className="text-muted-foreground">Você receberá um WhatsApp com os detalhes.</p>
              <div className="bg-muted/50 p-4 rounded-xl border text-sm space-y-2">
                <p><strong>Dentista:</strong> {selectedDentista?.nome}</p>
                <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedSlot}</p>
                <p className="text-primary font-bold">Valor: R$ {selectedProcedimento?.preco.toFixed(2)}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>Novo Agendamento</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}