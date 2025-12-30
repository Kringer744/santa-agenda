import { useState, useMemo } from 'react'; 
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, Clock, Smile, CreditCard, ChevronLeft } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useAgendaDia } from '@/hooks/useAgendaDia';
import { useCreateConsulta } from '@/hooks/useConsultas';
import { format, addMinutes, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ClientAppointment() {
  const [searchParams] = useSearchParams();
  const pacienteIdUrl = searchParams.get('paciente_id');
  
  const [step, setStep] = useState(pacienteIdUrl ? 2 : 1);
  const [selectedDentistaId, setSelectedDentistaId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [pixData, setPixData] = useState<any>(null);
  
  // Dados para novo paciente
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');

  const { data: dentistas = [] } = useDentistas();
  const { data: clinicas = [] } = useClinicas();
  const { data: pacientes = [] } = usePacientes();
  const { data: todasAgendas = [] } = useAgendaDia();
  const createConsulta = useCreateConsulta();
  const createPaciente = useCreatePaciente();

  const currentPaciente = useMemo(() => pacientes.find(p => p.id === pacienteIdUrl), [pacientes, pacienteIdUrl]);

  // Horários disponíveis para a data selecionada e dentista
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedDentistaId) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const agenda = todasAgendas.find(a => a.dentista_id === selectedDentistaId && a.data === dateStr);
    if (!agenda) return [];
    return agenda.horarios_disponiveis.filter(slot => !agenda.horarios_ocupados.includes(slot));
  }, [selectedDate, selectedDentistaId, todasAgendas]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createPaciente.mutateAsync({ 
        nome, telefone, cpf, tags: ['cliente-web'], email: null, data_nascimento: null 
      });
      toast.success(`Bem-vindo, ${res.nome}!`);
      setStep(2);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBook = async () => {
    const pacienteId = pacienteIdUrl || pacientes.find(p => p.telefone === telefone)?.id;
    if (!pacienteId || !selectedDate || !selectedSlot || !selectedDentistaId) return;

    const start = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`);
    const end = addMinutes(start, 30);

    try {
      await createConsulta.mutateAsync({
        paciente_id: pacienteId,
        dentista_id: selectedDentistaId,
        clinica_id: clinicas[0]?.id || '',
        data_hora_inicio: start.toISOString(),
        data_hora_fim: end.toISOString(),
        procedimentos: [],
        valor_total: 150,
        pix_txid: null,
        pix_qr_code_base64: null,
        pix_copia_e_cola: null,
      });

      // Gerar Pix (Simulado ou real via Edge Function)
      const { data } = await supabase.functions.invoke('itau-auth');
      const res = await supabase.functions.invoke('itau-pix-create', {
        body: { access_token: data.access_token, valor: 150, paciente_cpf: cpf || currentPaciente?.cpf, paciente_nome: nome || currentPaciente?.nome }
      });

      if (res.data?.success) {
        setPixData(res.data.pix_data);
        setStep(4);
      }
    } catch (err: any) { toast.error("Erro ao gerar agendamento"); }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-elevated">
        <CardHeader className="text-center border-b pb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Smile size={32} />
          </div>
          <CardTitle className="text-2xl font-bold">DentalClinic</CardTitle>
          <CardDescription>Agende sua consulta em poucos cliques</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {/* STEP 1: Cadastro */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={cpf} onChange={e => setCpf(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createPaciente.isPending}>
                Continuar para Agendamento
              </Button>
            </form>
          )}

          {/* STEP 2: Seleção de Dentista e Data */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <Label className="text-base">Escolha o Dentista</Label>
                <div className="grid grid-cols-1 gap-2">
                  {dentistas.map(d => (
                    <Button 
                      key={d.id} 
                      variant={selectedDentistaId === d.id ? "default" : "outline"}
                      className="h-14 justify-start text-left gap-3"
                      onClick={() => setSelectedDentistaId(d.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {d.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold leading-none">{d.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1">{d.especialidade || 'Clínico Geral'}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedDentistaId && (
                <div className="space-y-3 animate-slide-up">
                  <Label className="text-base">Escolha o Dia</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setStep(3); }}
                    locale={ptBR}
                    className="mx-auto border rounded-xl"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Seleção de Horário */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft size={16} /> Voltar para o calendário
              </Button>
              
              <div className="space-y-3">
                <Label className="text-base">Horários disponíveis para {format(selectedDate!, "dd/MM")}</Label>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(slot => (
                      <Button 
                        key={slot} 
                        variant={selectedSlot === slot ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot)}
                        className="gap-2"
                      >
                        <Clock size={14} /> {slot}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-muted/50 rounded-xl border border-dashed">
                    <p className="text-sm text-muted-foreground">Não há horários para este dia.</p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-12 text-lg" 
                disabled={!selectedSlot || createConsulta.isPending}
                onClick={handleBook}
              >
                {createConsulta.isPending ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2" />}
                Confirmar e Pagar R$ 150,00
              </Button>
            </div>
          )}

          {/* STEP 4: Pagamento PIX */}
          {step === 4 && pixData && (
            <div className="space-y-6 text-center animate-fade-in">
              <div className="bg-mint-light p-4 rounded-xl inline-block mb-4">
                <CheckCircle className="text-secondary w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Agendamento Pré-Reservado!</h3>
              <p className="text-muted-foreground text-sm">Pague o Pix abaixo para confirmar sua consulta.</p>
              
              <div className="bg-white p-4 rounded-xl border shadow-sm mx-auto w-fit">
                <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Pix Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input value={pixData.pixCopiaECola} readOnly className="font-mono text-xs" />
                  <Button size="icon" onClick={() => { navigator.clipboard.writeText(pixData.pixCopiaECola); toast.info('Copiado!'); }}>
                    <CheckCircle size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}