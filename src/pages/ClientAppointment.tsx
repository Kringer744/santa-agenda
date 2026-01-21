import { useState, useMemo } from 'react'; 
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Clock, Stethoscope, ChevronLeft, Cake, CalendarCheck } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useTodasAgendas, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista';
import { useCreateConsulta } from '@/hooks/useConsultas';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendar';
import { format, addMinutes, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgendaDentista, Paciente } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export default function ClientAppointment() {
  const [searchParams] = useSearchParams();
  const pacienteIdUrl = searchParams.get('paciente_id');
  
  const [step, setStep] = useState(pacienteIdUrl ? 2 : 1);
  const [selectedDentistaId, setSelectedDentistaId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [currentPacienteId, setCurrentPacienteId] = useState<string | null>(pacienteIdUrl);

  const { data: dentistas = [] } = useDentistas();
  const { data: clinicas = [] } = useClinicas();
  const { data: pacientes = [] } = usePacientes();
  const { data: todasAgendas = [] } = useTodasAgendas();
  const createConsulta = useCreateConsulta();
  const createPaciente = useCreatePaciente();
  const updateAgenda = useUpdateAgendaDentista();
  const googleCalendarSync = useGoogleCalendarSync();

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

      if (isToday) {
        return slot > currentHourMin;
      }

      return true;
    });
  }, [selectedDate, selectedDentistaId, todasAgendas]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!nome || !telefone || !cpf || !dataNascimento) {
        toast.error("Por favor, preencha todos os campos.");
        return;
      }

      const cleanedCpf = cpf.replace(/\D/g, '');
      const cleanedTelefone = telefone.replace(/\D/g, '');

      const { data: existingPatients, error: fetchError } = await supabase
        .from('pacientes')
        .select('id, nome')
        .or(`cpf.eq.${cleanedCpf},telefone.eq.${cleanedTelefone}`);

      if (fetchError) throw fetchError;

      let pacienteToUse: Paciente | null = null;

      if (existingPatients && existingPatients.length > 0) {
        pacienteToUse = existingPatients[0] as Paciente;
        toast.info(`Paciente "${pacienteToUse.nome}" já cadastrado.`);
      } else {
        const newPaciente = await createPaciente.mutateAsync({ 
          nome, 
          telefone: cleanedTelefone, 
          cpf: cleanedCpf, 
          data_nascimento: dataNascimento,
          tags: ['cliente-web'], 
          email: null,
          observacoes: null,
          meses_retorno: 6, // Adicionado meses_retorno
        });
        pacienteToUse = newPaciente;
        toast.success(`Olá ${newPaciente.nome}, vamos agendar sua consulta.`);
      }
      
      if (pacienteToUse) {
        setCurrentPacienteId(pacienteToUse.id);
        setStep(2);
      }

    } catch (err: any) { 
      toast.error(`Erro ao cadastrar: ${err.message}`); 
    }
  };

  const handleBook = async () => {
    const paciente = pacientes.find(p => p.id === currentPacienteId);
    const selectedDentista = dentistas.find(d => d.id === selectedDentistaId);
    
    if (clinicas.length === 0) {
      toast.error("Erro interno: Clínica não configurada.");
      return;
    }

    if (!currentPacienteId || !selectedDate || !selectedSlot || !selectedDentista) {
      toast.error("Por favor, selecione todos os campos.");
      return;
    }

    const startDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`);
    const endDateTime = addMinutes(startDateTime, 30);

    try {
      await createConsulta.mutateAsync({
        paciente_id: currentPacienteId,
        dentista_id: selectedDentistaId,
        clinica_id: clinicas[0]?.id || '',
        data_hora_inicio: startDateTime.toISOString(),
        data_hora_fim: endDateTime.toISOString(),
        procedimentos: [],
        valor_total: 150,
        pix_txid: null,
        pix_qr_code_base64: null,
        pix_copia_e_cola: null,
      });

      const agendaDoDia = todasAgendas.find((a: AgendaDentista) => a.dentista_id === selectedDentistaId && a.data === format(selectedDate, 'yyyy-MM-dd'));
      if (agendaDoDia) {
        const newHorariosOcupados = [...agendaDoDia.horarios_ocupados, selectedSlot].sort();
        await updateAgenda.mutateAsync({
          id: agendaDoDia.id,
          horarios_ocupados: newHorariosOcupados
        });
      }

      if (selectedDentista.google_calendar_id) {
        try {
          await googleCalendarSync.mutateAsync({
            action: 'createEvent',
            calendarId: selectedDentista.google_calendar_id,
            eventData: {
              summary: `Consulta: ${paciente?.nome} com ${selectedDentista.nome}`,
              description: `Paciente: ${paciente?.nome}\nTelefone: ${paciente?.telefone}`,
              start: { dateTime: startDateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
              end: { dateTime: endDateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
            }
          });
        } catch (syncErr: any) {
          console.error("[Sync] Erro na sincronização com Google Calendar:", syncErr);
          toast.warning("Consulta agendada, mas houve uma falha na sincronização com o Google Agenda.");
        }
      }

      setStep(4);
    } catch (err: any) { 
      toast.error(`Erro ao gerar agendamento: ${err.message}`); 
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 gradient-dental rounded-xl flex items-center justify-center shadow-soft text-white">
          <Stethoscope size={28} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">DentalClinic</h1>
      </div>

      <Card className="w-full max-w-lg shadow-elevated border-border/50">
        <CardHeader className="text-center border-b pb-6 bg-muted/20">
          <CardTitle className="text-xl">Agendamento Online</CardTitle>
          <CardDescription>Rápido, fácil e seguro</CardDescription>
        </CardHeader>

        <CardContent className="pt-8">
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Como prefere ser chamado?" />
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
                <Label className="flex items-center gap-2">
                  <Cake size={14} className="text-primary" /> Data de Nascimento
                </Label>
                <Input 
                  type="date" 
                  value={dataNascimento} 
                  onChange={e => setDataNascimento(e.target.value)} 
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90" disabled={createPaciente.isPending}>
                {createPaciente.isPending ? <Loader2 className="animate-spin" /> : 'Próximo Passo'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label className="text-base font-bold">1. Selecione o Dentista</Label>
                <div className="grid grid-cols-1 gap-3">
                  {dentistas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum dentista disponível.</p>
                  ) : dentistas.map(d => (
                    <button 
                      key={d.id} 
                      onClick={() => setSelectedDentistaId(d.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                        selectedDentistaId === d.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {d.nome.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{d.nome}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{d.especialidade || 'Clínico Geral'}</p>
                      </div>
                      {selectedDentistaId === d.id && <CheckCircle className="text-primary" size={20} />}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDentistaId && (
                <div className="space-y-3 pt-4 border-t animate-slide-up">
                  <Label className="text-base font-bold">2. Escolha o Melhor Dia</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); if(d) setStep(3); }}
                    locale={ptBR}
                    className="mx-auto rounded-xl border shadow-sm"
                    disabled={(date) => {
                      const today = startOfDay(new Date());
                      return date < today;
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-muted-foreground hover:text-primary">
                <ChevronLeft size={16} className="mr-1" /> Alterar dia ou dentista
              </Button>
              
              <div className="space-y-4">
                <Label className="text-lg font-bold">Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}</Label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot: string) => (
                      <Button 
                        key={slot} 
                        variant={selectedSlot === slot ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn("h-12 text-base font-medium", selectedSlot === slot && "shadow-lg shadow-primary/20")}
                      >
                        <Clock size={16} className="mr-2" /> {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Não há horários livres para este dia.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t">
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20" 
                  disabled={!selectedSlot || createConsulta.isPending}
                  onClick={handleBook}
                >
                  {createConsulta.isPending ? <Loader2 className="animate-spin mr-2" /> : <CalendarCheck className="mr-2" />}
                  Confirmar Agendamento
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 text-center animate-fade-in py-10">
              <div className="bg-emerald-100 p-6 rounded-full inline-block">
                <CheckCircle className="text-emerald-600 w-12 h-12" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h3>
                <p className="text-muted-foreground">
                  Sua consulta foi agendada com sucesso. Você receberá um lembrete via WhatsApp próximo ao horário do atendimento.
                </p>
                <div className="bg-muted/50 p-4 rounded-xl border space-y-2 text-sm text-left">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-bold">{selectedDate ? format(selectedDate, "dd/MM/yyyy") : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário:</span>
                    <span className="font-bold">{selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    <span className="font-bold text-primary">A realizar na clínica</span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                Novo Agendamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground">
        DentalClinic • Sistema Profissional
      </p>
    </div>
  );
}