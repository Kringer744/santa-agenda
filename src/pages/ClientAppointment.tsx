import { useState, useMemo } from 'react'; 
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Clock, Stethoscope, CreditCard, ChevronLeft, Cake } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useTodasAgendas, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista'; // Importar useTodasAgendas
import { useCreateConsulta } from '@/hooks/useConsultas';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendar'; // Importar o novo hook
import { format, addMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AgendaDentista } from '@/types'; // Importar AgendaDentista type

export default function ClientAppointment() {
  const [searchParams] = useSearchParams();
  const pacienteIdUrl = searchParams.get('paciente_id');
  
  const [step, setStep] = useState(pacienteIdUrl ? 2 : 1);
  const [selectedDentistaId, setSelectedDentistaId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [pixData, setPixData] = useState<any>(null);
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');

  const { data: dentistas = [] } = useDentistas();
  const { data: clinicas = [] } = useClinicas();
  const { data: pacientes = [] } = usePacientes();
  const { data: todasAgendas = [] } = useTodasAgendas(); // Usar useTodasAgendas
  const createConsulta = useCreateConsulta();
  const createPaciente = useCreatePaciente();
  const updateAgenda = useUpdateAgendaDentista(); // Hook para atualizar a agenda do dentista
  const googleCalendarSync = useGoogleCalendarSync(); // Hook para sincronização com Google Calendar

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedDentistaId) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const agenda = todasAgendas.find((a: AgendaDentista) => a.dentista_id === selectedDentistaId && a.data === dateStr);
    if (!agenda) return [];
    return agenda.horarios_disponiveis.filter((slot: string) => !agenda.horarios_ocupados.includes(slot));
  }, [selectedDate, selectedDentistaId, todasAgendas]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!nome || !telefone || !cpf || !dataNascimento) {
        toast.error("Por favor, preencha todos os campos, incluindo sua data de nascimento.");
        return;
      }
      const res = await createPaciente.mutateAsync({ 
        nome, 
        telefone, 
        cpf, 
        data_nascimento: dataNascimento,
        tags: ['cliente-web'], 
        email: null 
      });
      toast.success(`Olá ${res.nome}, vamos agendar sua consulta.`);
      setStep(2);
    } catch (err: any) { 
      console.error("Erro no cadastro:", err);
      toast.error(`Erro ao cadastrar: ${err.message || 'Verifique se os dados já existem.'}`); 
    }
  };

  const handleBook = async () => {
    const paciente = pacienteIdUrl ? pacientes.find(p => p.id === pacienteIdUrl) : pacientes.find(p => p.telefone === telefone);
    const pacienteId = paciente?.id;
    const selectedDentista = dentistas.find(d => d.id === selectedDentistaId);
    
    if (clinicas.length === 0) {
      toast.error("Erro interno: Clínica não configurada. O administrador precisa acessar as Configurações do sistema primeiro.");
      return;
    }

    if (!pacienteId || !selectedDate || !selectedSlot || !selectedDentista) {
      toast.error("Por favor, selecione o dentista, a data e o horário.");
      return;
    }

    const startDateTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`);
    const endDateTime = addMinutes(startDateTime, 30); // Assumindo consultas de 30 minutos

    try {
      const newConsulta = await createConsulta.mutateAsync({
        paciente_id: pacienteId,
        dentista_id: selectedDentistaId,
        clinica_id: clinicas[0]?.id || '',
        data_hora_inicio: startDateTime.toISOString(),
        data_hora_fim: endDateTime.toISOString(),
        procedimentos: [], // Pode ser adicionado depois
        valor_total: 150, // Valor fixo por enquanto
        pix_txid: null,
        pix_qr_code_base64: null,
        pix_copia_e_cola: null,
      });

      // Atualizar agenda do dentista no Supabase para marcar o horário como ocupado
      const agendaDoDia = todasAgendas.find((a: AgendaDentista) => a.dentista_id === selectedDentistaId && a.data === format(selectedDate, 'yyyy-MM-dd'));
      if (agendaDoDia) {
        const newHorariosOcupados = [...agendaDoDia.horarios_ocupados, selectedSlot].sort();
        await updateAgenda.mutateAsync({
          id: agendaDoDia.id,
          horarios_ocupados: newHorariosOcupados
        });
      }

      // Sincronizar com Google Calendar
      if (selectedDentista.google_calendar_id) {
        await googleCalendarSync.mutateAsync({
          action: 'createEvent',
          calendarId: selectedDentista.google_calendar_id,
          eventData: {
            summary: `Consulta: ${paciente?.nome} com ${selectedDentista.nome}`,
            description: `Paciente: ${paciente?.nome}\nTelefone: ${paciente?.telefone}\nConsulta ID: ${newConsulta.id}`,
            start: { dateTime: startDateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
            end: { dateTime: endDateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
            attendees: [{ email: paciente?.email || '' }, { email: selectedDentista.email || '' }].filter(a => a.email),
          }
        });
      } else {
        toast.warning("ID do Google Calendar não configurado para este dentista. Agendamento não sincronizado.");
      }

      setPixData({ 
        qrCodeBase64: 'placeholder', 
        pixCopiaECola: '00020126360014BR.GOV.BCB.PIX0114241648318805204000053039865802BR5925DentalClinic6009SAO PAULO62070503***6304' 
      });
      setStep(4);
      toast.success("Reserva realizada! Efetue o pagamento para confirmar.");
    } catch (err: any) { 
      console.error("Erro no agendamento:", err);
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
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum dentista disponível no momento.</p>
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
                    onSelect={(d) => { setSelectedDate(d); setStep(3); }}
                    locale={ptBR}
                    className="mx-auto rounded-xl border shadow-sm"
                    disabled={(date) => date < new Date()}
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
                    <p className="text-muted-foreground">Desculpe, não há horários livres para este dia.</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Valor da Consulta:</span>
                  <span className="text-lg font-bold text-primary">R$ 150,00</span>
                </div>
                <Button 
                  className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20" 
                  disabled={!selectedSlot || createConsulta.isPending}
                  onClick={handleBook}
                >
                  {createConsulta.isPending ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2" />}
                  Confirmar Agendamento
                </Button>
              </div>
            </div>
          )}

          {step === 4 && pixData && (
            <div className="space-y-8 text-center animate-fade-in">
              <div className="bg-primary/10 p-6 rounded-full inline-block animate-bounce-subtle">
                <CheckCircle className="text-primary w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Reserva Concluída!</h3>
                <p className="text-muted-foreground">Agora, realize o pagamento via Pix para confirmar seu horário.</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border-2 border-primary/20 shadow-lg mx-auto w-fit">
                <div className="w-56 h-56 bg-muted flex items-center justify-center text-muted-foreground">
                   [QR CODE PIX]
                </div>
              </div>

              <div className="space-y-3 text-left">
                <Label className="text-xs uppercase font-bold text-muted-foreground ml-1">Chave Pix (Copia e Cola)</Label>
                <div className="flex gap-2">
                  <Input value={pixData.pixCopiaECola} readOnly className="font-mono text-sm bg-muted/50 border-primary/20" />
                  <Button size="icon" className="flex-shrink-0" onClick={() => { navigator.clipboard.writeText(pixData.pixCopiaECola); toast.success('Chave Pix copiada!'); }}>
                    <CheckCircle size={18} />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Sua reserva expira em 30 minutos caso o pagamento não seja identificado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground flex items-center gap-1">
        DentalClinic • Sistema de Atendimento Odontológico Profissional
      </p>
    </div>
  );
}