import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, CheckCircle, QrCode, Copy, XCircle, UserPlus, Stethoscope } from 'lucide-react'; // Updated icons
import { useDentistas } from '@/hooks/useDentistas'; // Updated hook
import { usePacientes, useCreatePaciente } from '@/hooks/usePacientes'; // Updated hooks
import { useClinicas } from '@/hooks/useClinicas'; // Updated hook
import { useAgendaDia } from '@/hooks/useAgendaDia'; // Updated hook
import { useCreateConsulta, useUpdateConsultaStatus } from '@/hooks/useConsultas'; // Updated hooks
import { cn } from '@/lib/utils';
import { format, isBefore, isAfter, addDays, differenceInDays, parseISO } from 'date-fns'; // Added parseISO
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendImageMessage, sendTextMessage } from '@/lib/uazap';
import { DentistaSelectorAndCreator } from '@/components/appointment/DentistaSelectorAndCreator'; // Corrected import path

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface WhatsAppConfig {
  apiUrl: string;
  instanceToken: string;
}

export default function ClientAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPacienteId = searchParams.get('paciente_id'); // Changed from tutor_id
  const initialDentistaId = searchParams.get('dentista_id'); // Changed from pet_id
  
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | undefined>(initialPacienteId || undefined);
  const [selectedDentistaId, setSelectedDentistaId] = useState<string | undefined>(initialDentistaId || undefined);
  const [selectedClinicaId, setSelectedClinicaId] = useState<string | undefined>(undefined); // Changed from selectedUnidadeId
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>(undefined); // New state for time slot
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); // New state for single date selection
  const [appointmentValue, setAppointmentValue] = useState<number>(0); // Changed from reservationValue
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Dates, 2: Confirm & Pay, 3: Payment Status
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; pixCopiaECola: string; txid: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [consultaId, setConsultaId] = useState<string | null>(null); // Changed from reservaId
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);

  // States for new paciente form
  const [newPacienteName, setNewPacienteName] = useState('');
  const [newPacienteCpf, setNewPacienteCpf] = useState('');
  const [newPacientePhone, setNewPacientePhone] = useState('');
  const [newPacienteEmail, setNewPacienteEmail] = useState('');
  const [newPacienteDob, setNewPacienteDob] = useState('');
  
  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas(); // Updated hook
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes(); // Updated hook
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas(); // Updated hook
  const { data: agendaDia = [], isLoading: loadingAgendaDia } = useAgendaDia(); // Updated hook
  const createConsulta = useCreateConsulta(); // Updated hook
  const updateConsultaStatus = useUpdateConsultaStatus(); // Updated hook
  const createPaciente = useCreatePaciente(); // Updated hook
  
  const isLoading = loadingDentistas || loadingPacientes || loadingClinicas || loadingAgendaDia;
  
  const currentPaciente = useMemo(() => pacientes.find(p => p.id === selectedPacienteId), [pacientes, selectedPacienteId]);
  const currentDentista = useMemo(() => dentistas.find(d => d.id === selectedDentistaId), [dentistas, selectedDentistaId]);

  // Load WhatsApp config
  useEffect(() => {
    const loadWhatsappConfig = async () => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('api_url, instance_token')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Error loading WhatsApp config:', error);
      } else if (data) {
        setWhatsappConfig({
          apiUrl: data.api_url,
          instanceToken: data.instance_token,
        });
      }
    };
    loadWhatsappConfig();
  }, []);

  // Calculate appointment value (simple example: R$100 per appointment)
  useEffect(() => {
    if (selectedDate && selectedTimeSlot && currentDentista) {
      setAppointmentValue(100); // Fixed price for a basic appointment
    } else {
      setAppointmentValue(0);
    }
  }, [selectedDate, selectedTimeSlot, currentDentista]);

  // Polling for Pix payment status
  useEffect(() => {
    if (currentStep === 3 && pixData?.txid && consultaId && paymentStatus === 'pending') {
      const interval = setInterval(async () => {
        try {
          // 1. Get Itaú Auth Token
          const { data: authData, error: authError } = await supabase.functions.invoke('itau-auth');
          if (authError) throw authError;
          if (!authData?.access_token) throw new Error('Failed to get Itaú access token.');

          // 2. Check Pix Payment Status
          const { data: pixCheckData, error: pixCheckError } = await supabase.functions.invoke('itau-pix-check', {
            body: {
              access_token: authData.access_token,
              txid: pixData.txid,
            },
          });
          if (pixCheckError) throw pixCheckError;

          if (pixCheckData?.is_paid) {
            setPaymentStatus('paid');
            clearInterval(interval);
            toast.success('Pagamento Pix confirmado! Sua consulta está aprovada.');
            // Update consulta status in DB
            updateConsultaStatus.mutate({ id: consultaId, status: 'confirmada' });

            // NEW: Send QR code and Pix Copia e Cola to WhatsApp
            if (whatsappConfig && currentPaciente?.telefone && pixData.qrCodeBase64) {
              const caption = `🎉 Sua consulta na DentalClinic foi confirmada!\n\nPaciente: ${currentPaciente?.nome}\nDentista: ${currentDentista?.nome}\nData: ${format(selectedDate!, 'dd/MM/yyyy', { locale: ptBR })}\nHorário: ${selectedTimeSlot}\nValor: R$ ${appointmentValue.toFixed(2)}\n\nCódigo da consulta: ${pixData.txid}\n\nObrigado por escolher a DentalClinic! 🦷`;
              
              await sendImageMessage(
                whatsappConfig,
                currentPaciente.telefone,
                pixData.qrCodeBase64,
                caption
              );
              await sendTextMessage(
                whatsappConfig,
                currentPaciente.telefone,
                `Chave Pix Copia e Cola: ${pixData.pixCopiaECola}`
              );
              toast.info('Confirmação de consulta e Pix enviados para o WhatsApp!');
            }

          } else if (
            pixCheckData?.pix_status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR' ||
            pixCheckData?.pix_status === 'REMOVIDA_PELO_PSP'
          ) {
            setPaymentStatus('failed');
            clearInterval(interval);
            toast.error('Pagamento Pix cancelado ou expirado.');
            // Optionally update consulta status to 'cancelada'
            updateConsultaStatus.mutate({ id: consultaId, status: 'cancelada' });
          }
        } catch (error: any) {
          console.error('Erro ao verificar status do Pix:', error);
          toast.error(`Erro ao verificar pagamento: ${error.message}`);
          clearInterval(interval);
          setPaymentStatus('failed');
        }
      }, 5000); // Poll every 5 seconds
      
      setPollingInterval(interval as unknown as number); // Store interval ID
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [currentStep, pixData, consultaId, paymentStatus, updateConsultaStatus, pollingInterval, whatsappConfig, currentPaciente, currentDentista, selectedDate, selectedTimeSlot, appointmentValue]);

  const getAvailableTimeSlots = (clinicaId: string, dentistaId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const agendaDoDia = agendaDia.find(a => a.clinica_id === clinicaId && a.dentista_id === dentistaId && a.data === dateString);
    
    if (!agendaDoDia) {
      // Default slots if no specific agenda for the day
      return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    }
    
    const allSlots = agendaDoDia.horarios_disponiveis;
    const occupiedSlots = agendaDoDia.horarios_ocupados;
    
    return allSlots.filter(slot => !occupiedSlots.includes(slot));
  };

  const isDateUnavailable = (date: Date) => {
    if (!selectedClinicaId || !selectedDentistaId) return false;
    const availableSlots = getAvailableTimeSlots(selectedClinicaId, selectedDentistaId, date);
    return availableSlots.length === 0;
  };

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeSlot(undefined); // Reset time slot when date changes
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
      toast.success('Paciente cadastrado com sucesso!');
      setSelectedPacienteId(newPaciente.id);
      // Clear form fields after successful creation
      setNewPacienteName('');
      setNewPacienteCpf('');
      setNewPacientePhone('');
      setNewPacienteEmail('');
      setNewPacienteDob('');
    } catch (error: any) {
      toast.error(`Erro ao cadastrar paciente: ${error.message}`);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedClinicaId || !currentDentista || !currentPaciente || appointmentValue <= 0) {
      toast.error('Por favor, preencha todos os dados da consulta.');
      return;
    }

    const startDateTime = parseISO(format(selectedDate, 'yyyy-MM-dd') + 'T' + selectedTimeSlot + ':00');
    const endDateTime = addDays(startDateTime, 0); // Assuming 30 min appointment for simplicity, adjust as needed

    // 1. Create pending consulta in DB
    const newConsultaData = {
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
    };

    try {
      const createdConsulta = await createConsulta.mutateAsync(newConsultaData);
      setConsultaId(createdConsulta.id);
      toast.success('Consulta criada com sucesso! Gerando Pix para pagamento.');

      // 2. Get Itaú Auth Token
      const { data: authData, error: authError } = await supabase.functions.invoke('itau-auth');
      if (authError) throw authError;
      if (!authData?.access_token) throw new Error('Failed to get Itaú access token.');

      // 3. Create Pix Charge
      const txid = `CONSULTA${createdConsulta.id.replace(/-/g, '').substring(0, 25).toUpperCase()}`;
      const { data: pixCreateData, error: pixCreateError } = await supabase.functions.invoke('itau-pix-create', {
        body: {
          access_token: authData.access_token,
          valor: appointmentValue,
          txid: txid,
          tutor_cpf: currentPaciente.cpf, // Using paciente CPF
          tutor_nome: currentPaciente.nome, // Using paciente nome
          solicitacaoPagador: `Consulta Odontológica - ${currentPaciente.nome} (${currentDentista.nome})`,
        },
      });
      if (pixCreateError) throw pixCreateError;

      if (pixCreateData?.success && pixCreateData.pix_data) {
        const { pixCopiaECola, qrCodeBase64, txid: returnedTxid } = pixCreateData.pix_data;
        setPixData({
          qrCodeBase64: qrCodeBase64,
          pixCopiaECola: pixCopiaECola,
          txid: returnedTxid,
        });

        // Update consulta with Pix details
        await supabase
          .from('consultas')
          .update({
            pix_txid: returnedTxid,
            pix_qr_code_base64: qrCodeBase64,
            pix_copia_e_cola: pixCopiaECola,
            pagamento_status: 'pendente',
          })
          .eq('id', createdConsulta.id);

        setCurrentStep(3); // Move to payment status step
      } else {
        throw new Error('Falha ao gerar dados do Pix.');
      }
    } catch (error: any) {
      console.error('Erro ao confirmar consulta ou gerar Pix:', error);
      toast.error(`Erro: ${error.message}`);
      
      // If consulta was created but Pix failed, mark consulta as canceled or pending payment error
      if (consultaId) {
        updateConsultaStatus.mutate({ id: consultaId, status: 'cancelada' });
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const availableTimeSlots = selectedDate && selectedClinicaId && selectedDentistaId
    ? getAvailableTimeSlots(selectedClinicaId, selectedDentistaId, selectedDate)
    : [];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Agendar Consulta</h1>
          <p className="text-muted-foreground mt-2">
            {currentPaciente && currentDentista ? 
              `Olá ${currentPaciente.nome}! Vamos agendar sua consulta com ${currentDentista.nome}.` :
              'Preencha os dados do paciente e do dentista para iniciar o agendamento.'
            }
          </p>
        </div>

        {currentStep === 1 && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>1. Informações do Paciente, Dentista e Horário</CardTitle>
              <CardDescription>Preencha os dados do paciente, selecione o dentista, data e horário desejados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Paciente Information Form */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    INFORMAÇÕES DO PACIENTE
                  </h4>
                  <form onSubmit={handleCreatePacienteAndProceed} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_paciente_nome">Nome completo</Label>
                      <Input id="new_paciente_nome" name="nome" required placeholder="Seu Nome Completo" value={newPacienteName} onChange={(e) => setNewPacienteName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new_paciente_cpf">CPF</Label>
                        <Input id="new_paciente_cpf" name="cpf" required placeholder="000.000.000-00" value={newPacienteCpf} onChange={(e) => setNewPacienteCpf(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_paciente_telefone">WhatsApp</Label>
                        <Input id="new_paciente_telefone" name="telefone" required placeholder="5511999999999" value={newPacientePhone} onChange={(e) => setNewPacientePhone(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_paciente_email">E-mail (opcional)</Label>
                      <Input id="new_paciente_email" name="email" type="email" placeholder="seu.email@exemplo.com" value={newPacienteEmail} onChange={(e) => setNewPacienteEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_paciente_data_nascimento">Data de nascimento (opcional)</Label>
                      <Input id="new_paciente_data_nascimento" name="data_nascimento" type="date" value={newPacienteDob} onChange={(e) => setNewPacienteDob(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createPaciente.isPending || !!selectedPacienteId}>
                      {createPaciente.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Cadastrar Paciente e Continuar'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Dentista Selector and Creator (only visible if paciente is selected) */}
              {selectedPacienteId && (
                <DentistaSelectorAndCreator
                  selectedPacienteId={selectedPacienteId}
                  selectedDentistaId={selectedDentistaId}
                  onSelectDentista={setSelectedDentistaId}
                  dentistas={dentistas}
                  isLoadingDentistas={loadingDentistas}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="clinica_id">Clínica</Label>
                <Select value={selectedClinicaId} onValueChange={setSelectedClinicaId} disabled={!currentDentista}>
                  <SelectTrigger>
                    <SelectValue placeholder={currentDentista ? "Selecione a clínica" : "Selecione o dentista primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicas.map(clinica => (
                      <SelectItem key={clinica.id} value={clinica.id}>
                        {clinica.nome} ({clinica.endereco ? clinica.endereco.split(',')[0] : 'Endereço não informado'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-4 justify-center">
                <Calendar
                  mode="single" // Changed to single date selection
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  disabled={(date) => isBefore(date, new Date()) || isDateUnavailable(date) || !selectedClinicaId || !currentDentista}
                  numberOfMonths={window.innerWidth > 768 ? 2 : 1}
                  locale={ptBR}
                  className="rounded-md border shadow-card p-3"
                />
              </div>

              {selectedDate && selectedClinicaId && selectedDentistaId && (
                <div className="space-y-2">
                  <Label htmlFor="time_slot">Horário Disponível</Label>
                  <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.length > 0 ? (
                        availableTimeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>Nenhum horário disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedDate && selectedTimeSlot && (
                <div className="text-center mt-4">
                  <p className="text-lg font-semibold text-foreground">
                    Data e Horário selecionados: {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} às {selectedTimeSlot}
                  </p>
                  <p className="text-2xl font-bold text-primary mt-4">
                    Valor Estimado: R$ {appointmentValue.toFixed(2)}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!selectedDate || !selectedTimeSlot || !selectedClinicaId || appointmentValue <= 0 || !currentPaciente || !currentDentista}
                className="w-full"
              >
                Continuar para Pagamento
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>2. Confirme sua Consulta</CardTitle>
              <CardDescription>Revise os detalhes e prossiga para o pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Paciente:</p>
                <p className="font-semibold text-foreground">{currentPaciente?.nome}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Dentista:</p>
                <p className="font-semibold text-foreground">{currentDentista?.nome} ({currentDentista?.especialidade})</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Clínica:</p>
                <p className="font-semibold text-foreground">{clinicas.find(c => c.id === selectedClinicaId)?.nome}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Data e Horário:</p>
                <p className="font-semibold text-foreground">
                  {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} às {selectedTimeSlot}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Valor Total:</p>
                <p className="text-2xl font-bold text-primary">R$ {appointmentValue.toFixed(2)}</p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={handleConfirmAppointment} 
                  className="flex-1"
                  disabled={createConsulta.isPending}
                >
                  {createConsulta.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Pagar com Pix'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && pixData && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {paymentStatus === 'pending' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                {paymentStatus === 'paid' && <CheckCircle className="w-5 h-5 text-secondary" />}
                {paymentStatus === 'failed' && <XCircle className="w-5 h-5 text-destructive" />}
                3. Pagamento Pix
              </CardTitle>
              <CardDescription>
                {paymentStatus === 'pending' && 'Escaneie o QR Code ou use a chave Pix para pagar.'}
                {paymentStatus === 'paid' && 'Pagamento confirmado! Sua consulta está aprovada.'}
                {paymentStatus === 'failed' && 'Pagamento falhou ou expirou. Tente novamente.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              {paymentStatus === 'pending' && (
                <>
                  <div className="flex justify-center">
                    {pixData.qrCodeBase64 ? (
                      <img 
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                        alt="QR Code Pix" 
                        className="w-48 h-48 border rounded-lg p-2" 
                      />
                    ) : (
                      <div className="w-48 h-48 border rounded-lg p-2 flex items-center justify-center bg-muted text-muted-foreground">
                        <QrCode className="w-12 h-12" />
                        <span className="sr-only">QR Code Pix</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Chave Pix Copia e Cola</Label>
                    <div className="flex items-center justify-center gap-2">
                      <Input 
                        value={pixData.pixCopiaECola} 
                        readOnly 
                        className="w-full max-w-xs text-center" 
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.pixCopiaECola);
                          toast.info('Chave Pix copiada!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Aguardando pagamento de R$ {appointmentValue.toFixed(2)}...
                  </p>
                </>
              )}
              
              {paymentStatus === 'paid' && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-20 h-20 text-secondary mx-auto" />
                  <p className="text-xl font-bold text-foreground">Consulta Confirmada!</p>
                  <p className="text-muted-foreground">Aguardamos você na clínica.</p>
                  <Button onClick={() => navigate('/')} className="mt-4">Voltar para o Início</Button>
                </div>
              )}
              
              {paymentStatus === 'failed' && (
                <div className="text-center space-y-4">
                  <XCircle className="w-20 h-20 text-destructive mx-auto" />
                  <p className="text-xl font-bold text-foreground">Pagamento Falhou</p>
                  <p className="text-muted-foreground">Não foi possível confirmar o pagamento. Por favor, tente novamente ou entre em contato.</p>
                  <Button onClick={() => setCurrentStep(2)} className="mt-4">Tentar Novamente</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}