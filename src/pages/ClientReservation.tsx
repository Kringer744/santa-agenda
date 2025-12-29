import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar as CalendarIcon, CheckCircle, QrCode, Copy, XCircle } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useTutores } from '@/hooks/useTutores';
import { useUnidades } from '@/hooks/useUnidades';
import { useVagasDia } from '@/hooks/useVagasDia';
import { useCreateReserva, useUpdateReservaStatus } from '@/hooks/useReservas';
import { cn } from '@/lib/utils';
import { format, isBefore, isAfter, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendImageMessage, sendTextMessage } from '@/lib/uazap';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface WhatsAppConfig {
  api_url: string;
  instance_token: string;
}

export default function ClientReservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTutorId = searchParams.get('tutor_id');
  const initialPetId = searchParams.get('pet_id');
  
  const [selectedTutorId, setSelectedTutorId] = useState<string | undefined>(initialTutorId || undefined);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>(initialPetId || undefined);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: undefined, 
    to: undefined 
  });
  const [reservationValue, setReservationValue] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Dates, 2: Confirm & Pay, 3: Payment Status
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; pixCopiaECola: string; txid: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | null>(null);
  
  const { data: pets = [], isLoading: loadingPets } = usePets();
  const { data: tutores = [], isLoading: loadingTutores } = useTutores();
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: vagasDia = [], isLoading: loadingVagasDia } = useVagasDia();
  const createReserva = useCreateReserva();
  const updateReservaStatus = useUpdateReservaStatus();
  
  const isLoading = loadingPets || loadingTutores || loadingUnidades || loadingVagasDia;
  
  const currentTutor = useMemo(() => tutores.find(t => t.id === selectedTutorId), [tutores, selectedTutorId]);
  const currentPet = useMemo(() => pets.find(p => p.id === selectedPetId), [pets, selectedPetId]);
  const tutorPets = useMemo(() => pets.filter(p => p.tutor_id === selectedTutorId), [pets, selectedTutorId]);

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
        setWhatsappConfig(data);
      }
    };
    loadWhatsappConfig();
  }, []);

  // Calculate reservation value based on dates and pet type
  useEffect(() => {
    if (dateRange.from && dateRange.to && currentPet) {
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      // Simple pricing: R$50/day for dog, R$40/day for cat
      const dailyRate = currentPet.especie === 'cachorro' ? 50 : 40;
      setReservationValue(days * dailyRate);
    } else {
      setReservationValue(0);
    }
  }, [dateRange, currentPet]);

  // Polling for Pix payment status
  useEffect(() => {
    if (currentStep === 3 && pixData?.txid && reservaId && paymentStatus === 'pending') {
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
            toast.success('Pagamento Pix confirmado! Sua reserva está aprovada.');
            // Update reservation status in DB
            updateReservaStatus.mutate({ id: reservaId, status: 'confirmada' });

            // NEW: Send QR code and Pix Copia e Cola to WhatsApp
            if (whatsappConfig && currentTutor?.telefone && pixData.qrCodeBase64) {
              const caption = `🎉 Sua reserva no PetHotel foi confirmada!\n\nPet: ${currentPet?.nome}\nCheck-in: ${format(dateRange.from!, 'dd/MM/yyyy', { locale: ptBR })}\nCheck-out: ${format(dateRange.to!, 'dd/MM/yyyy', { locale: ptBR })}\nValor: R$ ${reservationValue.toFixed(2)}\n\nCódigo da estadia: ${pixData.txid}\n\nObrigado por escolher o PetHotel! 🐾`;
              
              await sendImageMessage(
                whatsappConfig,
                currentTutor.telefone,
                pixData.qrCodeBase64,
                caption
              );
              await sendTextMessage(
                whatsappConfig,
                currentTutor.telefone,
                `Chave Pix Copia e Cola: ${pixData.pixCopiaECola}`
              );
              toast.info('Confirmação de reserva e Pix enviados para o WhatsApp!');
            }

          } else if (
            pixCheckData?.pix_status === 'REMOVIDA_PELO_USUARIO_RECEBEDOR' ||
            pixCheckData?.pix_status === 'REMOVIDA_PELO_PSP'
          ) {
            setPaymentStatus('failed');
            clearInterval(interval);
            toast.error('Pagamento Pix cancelado ou expirado.');
            // Optionally update reservation status to 'cancelada'
            updateReservaStatus.mutate({ id: reservaId, status: 'cancelada' });
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
  }, [currentStep, pixData, reservaId, paymentStatus, updateReservaStatus, pollingInterval, whatsappConfig, currentTutor, currentPet, dateRange, reservationValue]);

  const getAvailableVagas = (unidadeId: string, date: Date, especie: 'cachorro' | 'gato') => {
    const dateString = format(date, 'yyyy-MM-dd');
    const vagaDoDia = vagasDia.find(v => v.unidade_id === unidadeId && v.data === dateString);
    
    if (!vagaDoDia) {
      // Se não há registro para o dia, assume capacidade total da unidade
      const unidade = unidades.find(u => u.id === unidadeId);
      if (!unidade) return 0;
      return especie === 'cachorro' ? unidade.capacidade_cachorro : unidade.capacidade_gato;
    }
    
    return especie === 'cachorro' 
      ? vagaDoDia.vagas_cachorro_total - vagaDoDia.vagas_cachorro_ocupadas
      : vagaDoDia.vagas_gato_total - vagaDoDia.vagas_gato_ocupadas;
  };

  const isDateUnavailable = (date: Date) => {
    if (!selectedUnidadeId || !currentPet) return false;
    const available = getAvailableVagas(selectedUnidadeId, date, currentPet.especie);
    return available <= 0;
  };

  const handleSelectDates = (range: DateRange) => {
    setDateRange(range);
  };

  const handleConfirmReservation = async () => {
    if (!dateRange.from || !dateRange.to || !selectedUnidadeId || !currentPet || !currentTutor || reservationValue <= 0) {
      toast.error('Por favor, preencha todos os dados da reserva.');
      return;
    }

    // 1. Create pending reservation in DB
    const newReservaData = {
      tutor_id: currentTutor.id,
      pet_id: currentPet.id,
      unidade_id: selectedUnidadeId,
      check_in: format(dateRange.from, 'yyyy-MM-dd'),
      check_out: format(dateRange.to, 'yyyy-MM-dd'),
      servicos_adicionais: [],
      valor_total: reservationValue,
    };

    try {
      const createdReserva = await createReserva.mutateAsync(newReservaData);
      setReservaId(createdReserva.id);
      toast.success('Reserva criada com sucesso! Gerando Pix para pagamento.');

      // 2. Get Itaú Auth Token
      const { data: authData, error: authError } = await supabase.functions.invoke('itau-auth');
      if (authError) throw authError;
      if (!authData?.access_token) throw new Error('Failed to get Itaú access token.');

      // 3. Create Pix Charge
      const txid = `RESERVA${createdReserva.id.replace(/-/g, '').substring(0, 25).toUpperCase()}`; // Generate unique txid
      const { data: pixCreateData, error: pixCreateError } = await supabase.functions.invoke('itau-pix-create', {
        body: {
          access_token: authData.access_token,
          valor: reservationValue,
          txid: txid, // Pass txid for correlation, though the function now generates it
          tutor_cpf: currentTutor.cpf,
          tutor_nome: currentTutor.nome,
          solicitacaoPagador: `Hospedagem Pet - ${currentPet.nome} (${currentTutor.nome})`,
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

        // Update reservation with Pix details
        await supabase
          .from('reservas')
          .update({
            pix_txid: returnedTxid,
            pix_qr_code_base64: qrCodeBase64,
            pix_copia_e_cola: pixCopiaECola,
            pagamento_status: 'pendente',
          })
          .eq('id', createdReserva.id);

        setCurrentStep(3); // Move to payment status step
      } else {
        throw new Error('Falha ao gerar dados do Pix.');
      }
    } catch (error: any) {
      console.error('Erro ao confirmar reserva ou gerar Pix:', error);
      toast.error(`Erro: ${error.message}`);
      
      // If reservation was created but Pix failed, mark reservation as canceled or pending payment error
      if (reservaId) {
        updateReservaStatus.mutate({ id: reservaId, status: 'cancelada' });
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Reservar Hospedagem</h1>
          <p className="text-muted-foreground mt-2">
            {currentTutor && currentPet ? 
              `Olá ${currentTutor.nome}! Vamos reservar um lugar para ${currentPet.nome} (${currentPet.especie === 'cachorro' ? '🐶' : '🐱'}).` :
              'Selecione o tutor e o pet para iniciar a reserva.'
            }
          </p>
        </div>

        {currentStep === 1 && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>1. Selecione as Datas e Unidade</CardTitle>
              <CardDescription>Escolha o tutor, pet, período de hospedagem e a unidade desejada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tutor_id">Tutor</Label>
                <Select 
                  value={selectedTutorId} 
                  onValueChange={(value) => {
                    setSelectedTutorId(value);
                    setSelectedPetId(undefined); // Reset pet selection when tutor changes
                  }}
                  disabled={!!initialTutorId} // Disable if tutor_id came from URL
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutores.map(tutor => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pet_id">Pet</Label>
                <Select 
                  value={selectedPetId} 
                  onValueChange={setSelectedPetId}
                  disabled={!selectedTutorId || !!initialPetId} // Disable if no tutor selected or pet_id came from URL
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedTutorId ? "Selecione o pet" : "Selecione o tutor primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tutorPets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.especie === 'cachorro' ? '🐶' : '🐱'} {pet.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade_id">Unidade</Label>
                <Select value={selectedUnidadeId} onValueChange={setSelectedUnidadeId} disabled={!currentPet}>
                  <SelectTrigger>
                    <SelectValue placeholder={currentPet ? "Selecione a unidade" : "Selecione o pet primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(unidade => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} ({unidade.endereco ? unidade.endereco.split(',')[0] : 'Endereço não informado'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-4 justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleSelectDates}
                  disabled={(date) => isBefore(date, new Date()) || isDateUnavailable(date) || !selectedUnidadeId || !currentPet}
                  numberOfMonths={window.innerWidth > 768 ? 2 : 1} // 2 meses em desktop, 1 em mobile
                  locale={ptBR}
                  className="rounded-md border shadow-card p-3"
                />
              </div>
              
              {dateRange.from && dateRange.to && (
                <div className="text-center mt-4">
                  <p className="text-lg font-semibold text-foreground">
                    Período selecionado: {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  <p className="text-muted-foreground">
                    Total de dias: {differenceInDays(dateRange.to, dateRange.from) + 1}
                  </p>
                  <p className="text-2xl font-bold text-primary mt-4">
                    Valor Estimado: R$ {reservationValue.toFixed(2)}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!dateRange.from || !dateRange.to || !selectedUnidadeId || reservationValue <= 0 || !currentTutor || !currentPet}
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
              <CardTitle>2. Confirme sua Reserva</CardTitle>
              <CardDescription>Revise os detalhes e prossiga para o pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pet:</p>
                <p className="font-semibold text-foreground">{currentPet?.nome} ({currentPet?.especie === 'cachorro' ? '🐶' : '🐱'})</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tutor:</p>
                <p className="font-semibold text-foreground">{currentTutor?.nome}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Unidade:</p>
                <p className="font-semibold text-foreground">{unidades.find(u => u.id === selectedUnidadeId)?.nome}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Período:</p>
                <p className="font-semibold text-foreground">
                  {dateRange.from && format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {dateRange.to && format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Valor Total:</p>
                <p className="text-2xl font-bold text-primary">R$ {reservationValue.toFixed(2)}</p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={handleConfirmReservation} 
                  className="flex-1"
                  disabled={createReserva.isPending}
                >
                  {createReserva.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Pagar com Pix'}
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
                {paymentStatus === 'paid' && 'Pagamento confirmado! Sua reserva está aprovada.'}
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
                    Aguardando pagamento de R$ {reservationValue.toFixed(2)}...
                  </p>
                </>
              )}
              
              {paymentStatus === 'paid' && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-20 h-20 text-secondary mx-auto" />
                  <p className="text-xl font-bold text-foreground">Reserva Confirmada!</p>
                  <p className="text-muted-foreground">Aguardamos seu pet com carinho.</p>
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