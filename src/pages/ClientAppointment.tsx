import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, QrCode, Copy, XCircle, UserPlus } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes';
import { useClinicas } from '@/hooks/useClinicas';
import { useAgendaDia } from '@/hooks/useAgendaDia';
import { useCreateConsulta, useUpdateConsultaStatus } from '@/hooks/useConsultas';
import { format, isBefore, addMinutes, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendImageMessage, sendTextMessage } from '@/lib/uazap';
import { DentistaSelectorAndCreator } from '@/components/appointment/DentistaSelectorAndCreator';

interface WhatsAppConfig {
  apiUrl: string;
  instanceToken: string;
}

const APPOINTMENT_DURATION_MINUTES = 30;

export default function ClientAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPacienteId = searchParams.get('paciente_id');
  const initialDentistaId = searchParams.get('dentista_id');
  
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | undefined>(initialPacienteId || undefined);
  const [selectedDentistaId, setSelectedDentistaId] = useState<string | undefined>(initialDentistaId || undefined);
  const [selectedClinicaId, setSelectedClinicaId] = useState<string | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [appointmentValue, setAppointmentValue] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; pixCopiaECola: string; txid: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [consultaId, setConsultaId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);

  const [newPacienteName, setNewPacienteName] = useState('');
  const [newPacienteCpf, setNewPacienteCpf] = useState('');
  const [newPacientePhone, setNewPacientePhone] = useState('');
  const [newPacienteEmail, setNewPacienteEmail] = useState('');
  const [newPacienteDob, setNewPacienteDob] = useState('');
  
  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas();
  const { data: agendaDia = [], isLoading: loadingAgendaDia } = useAgendaDia();
  const createConsulta = useCreateConsulta();
  const updateConsultaStatus = useUpdateConsultaStatus();
  const createPaciente = useCreatePaciente();
  
  const isLoading = loadingDentistas || loadingPacientes || loadingClinicas || loadingAgendaDia;
  
  const currentPaciente = useMemo(() => pacientes.find(p => p.id === selectedPacienteId), [pacientes, selectedPacienteId]);
  const currentDentista = useMemo(() => dentistas.find(d => d.id === selectedDentistaId), [dentistas, selectedDentistaId]);

  useEffect(() => {
    const loadWhatsappConfig = async () => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('api_url, instance_token')
        .limit(1)
        .maybeSingle();
      if (data) {
        setWhatsappConfig({
          apiUrl: data.api_url,
          instanceToken: data.instance_token,
        });
      }
    };
    loadWhatsappConfig();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedTimeSlot && currentDentista) {
      setAppointmentValue(100);
    } else {
      setAppointmentValue(0);
    }
  }, [selectedDate, selectedTimeSlot, currentDentista]);

  useEffect(() => {
    if (currentStep === 3 && pixData?.txid && consultaId && paymentStatus === 'pending') {
      const interval = setInterval(async () => {
        try {
          const { data: authData } = await supabase.functions.invoke('itau-auth');
          if (!authData?.access_token) return;

          const { data: pixCheckData } = await supabase.functions.invoke('itau-pix-check', {
            body: { access_token: authData.access_token, txid: pixData.txid },
          });

          if (pixCheckData?.is_paid) {
            setPaymentStatus('paid');
            clearInterval(interval);
            toast.success('Pagamento Pix confirmado!');
            updateConsultaStatus.mutate({ id: consultaId, status: 'confirmada' });

            if (whatsappConfig && currentPaciente?.telefone && pixData.qrCodeBase64) {
              const caption = `🎉 Sua consulta foi confirmada!\n\nPaciente: ${currentPaciente?.nome}\nData: ${format(selectedDate!, 'dd/MM/yyyy')}\nHorário: ${selectedTimeSlot}`;
              await sendImageMessage(whatsappConfig, currentPaciente.telefone, pixData.qrCodeBase64, caption);
            }
          }
        } catch (error) { console.error(error); }
      }, 5000);
      setPollingInterval(interval as any);
      return () => clearInterval(interval);
    }
  }, [currentStep, pixData, consultaId, paymentStatus, updateConsultaStatus, pollingInterval, whatsappConfig, currentPaciente, selectedDate, selectedTimeSlot]);

  const getAvailableTimeSlots = (clinicaId: string, dentistaId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const agendaDoDia = agendaDia.find(a => a.clinica_id === clinicaId && a.dentista_id === dentistaId && a.data === dateString);
    if (!agendaDoDia) return [];
    const now = new Date();
    return (agendaDoDia.horarios_disponiveis || []).filter(slot => {
      const slotDateTime = parseISO(dateString + 'T' + slot + ':00');
      return !(agendaDoDia.horarios_ocupados || []).includes(slot) && (isBefore(now, slotDateTime) || !isSameDay(now, date));
    });
  };

  const isDateUnavailable = (date: Date) => {
    if (!selectedClinicaId || !selectedDentistaId) return false;
    return getAvailableTimeSlots(selectedClinicaId, selectedDentistaId, date).length === 0;
  };

  const handleCreatePacienteAndProceed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const newPaciente = await createPaciente.mutateAsync({
        nome: newPacienteName,
        cpf: newPacienteCpf,
        telefone: newPacientePhone,
        email: newPacienteEmail || null,
        data_nascimento: newPacienteDob || null,
        tags: ['cliente-web'],
      });
      setSelectedPacienteId(newPaciente.id);
    } catch (error: any) { toast.error(error.message); }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedClinicaId || !currentDentista || !currentPaciente) return;
    const startDateTime = parseISO(format(selectedDate, 'yyyy-MM-dd') + 'T' + selectedTimeSlot + ':00');
    const endDateTime = addMinutes(startDateTime, APPOINTMENT_DURATION_MINUTES);
    try {
      const createdConsulta = await createConsulta.mutateAsync({
        paciente_id: currentPaciente.id,
        dentista_id: currentDentista.id,
        clinica_id: selectedClinicaId,
        data_hora_inicio: startDateTime.toISOString(),
        data_hora_fim: endDateTime.toISOString(),
        procedimentos: [],
        valor_total: appointmentValue,
        pix_txid: null,
        pix_qr_code_base64: null,
        pix_copia_e_cola: null,
      });
      setConsultaId(createdConsulta.id);
      const { data: authData } = await supabase.functions.invoke('itau-auth');
      const txid = `CONSULTA${createdConsulta.id.replace(/-/g, '').substring(0, 20)}`;
      const { data: pixCreateData } = await supabase.functions.invoke('itau-pix-create', {
        body: { access_token: authData.access_token, valor: appointmentValue, txid, paciente_cpf: currentPaciente.cpf, paciente_nome: currentPaciente.nome },
      });
      if (pixCreateData?.success) {
        setPixData(pixCreateData.pix_data);
        await (supabase.from('consultas') as any).update({ pix_txid: pixCreateData.pix_data.txid, pix_qr_code_base64: pixCreateData.pix_data.qrCodeBase64, pagamento_status: 'pendente' }).eq('id', createdConsulta.id);
        setCurrentStep(3);
      }
    } catch (error: any) { toast.error(error.message); }
  };

  if (isLoading) return <Layout><Loader2 className="w-8 h-8 animate-spin mx-auto mt-20" /></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Agendar Consulta</h1>
          <p className="text-muted-foreground mt-2">Olá {currentPaciente?.nome}! Vamos agendar sua consulta.</p>
        </div>
        {currentStep === 1 && (
          <Card>
            <CardHeader><CardTitle>1. Dados da Consulta</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleCreatePacienteAndProceed} className="space-y-4">
                <Input placeholder="Nome completo" value={newPacienteName} onChange={e => setNewPacienteName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="CPF" value={newPacienteCpf} onChange={e => setNewPacienteCpf(e.target.value)} required />
                  <Input placeholder="WhatsApp" value={newPacientePhone} onChange={e => setNewPacientePhone(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={!!selectedPacienteId}>Registrar Paciente</Button>
              </form>
              {selectedPacienteId && (
                <DentistaSelectorAndCreator selectedPacienteId={selectedPacienteId} selectedDentistaId={selectedDentistaId} onSelectDentista={setSelectedDentistaId} dentistas={dentistas} isLoadingDentistas={loadingDentistas} />
              )}
              <Select value={selectedClinicaId} onValueChange={setSelectedClinicaId} disabled={!selectedDentistaId}>
                <SelectTrigger><SelectValue placeholder="Selecione a clínica" /></SelectTrigger>
                <SelectContent>{clinicas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={date => isBefore(date, new Date()) || isDateUnavailable(date)} locale={ptBR} />
              <Button onClick={() => setCurrentStep(2)} disabled={!selectedTimeSlot} className="w-full">Continuar</Button>
            </CardContent>
          </Card>
        )}
        {currentStep === 3 && pixData && (
          <Card className="text-center p-8 space-y-6">
            <CardTitle>Pagamento Pix</CardTitle>
            <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code" className="mx-auto w-48 h-48" />
            <div className="flex gap-2">
              <Input value={pixData.pixCopiaECola} readOnly />
              <Button onClick={() => { navigator.clipboard.writeText(pixData.pixCopiaECola); toast.info('Copiado!'); }}><Copy /></Button>
            </div>
            <p>Aguardando pagamento de R$ {appointmentValue.toFixed(2)}...</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}