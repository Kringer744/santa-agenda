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
import QRCode from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function ClientReservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tutorId = searchParams.get('tutor_id');
  const petId = searchParams.get('pet_id');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string | undefined>(undefined);
  const [reservationValue, setReservationValue] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Dates, 2: Confirm & Pay, 3: Payment Status
  const [pixData, setPixData] = useState<{ qrCodeBase64: string; pixCopiaECola: string; txid: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  const { data: pets = [], isLoading: loadingPets } = usePets();
  const { data: tutores = [], isLoading: loadingTutores } = useTutores();
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: vagasDia = [], isLoading: loadingVagasDia } = useVagasDia();
  const createReserva = useCreateReserva();
  const updateReservaStatus = useUpdateReservaStatus();
  
  const isLoading = loadingPets || loadingTutores || loadingUnidades || loadingVagasDia;
  
  const currentPet = useMemo(() => pets.find(p => p.id === petId), [pets, petId]);
  const currentTutor = useMemo(() => tutores.find(t => t.id === tutorId), [tutores, tutorId]);
  
  useEffect(() => {
    if (!tutorId || !petId) {
      toast.error('Informações do tutor ou pet ausentes. Por favor, inicie a reserva pelo WhatsApp.');
      navigate('/'); // Redireciona para a home ou uma página de erro
    }
  }, [tutorId, petId, navigate]);
  
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
            }
          });
          if (pixCheckError) throw pixCheckError;
          
          if (pixCheckData?.is_paid) {
            setPaymentStatus('paid');
            clearInterval(interval);
            toast.success('Pagamento Pix confirmado! Sua reserva está aprovada.');
            // Update reservation status in DB
            updateReservaStatus.mutate({ id: reservaId, status: 'confirmada' });
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
  }, [currentStep, pixData, reservaId, paymentStatus, updateReservaStatus, pollingInterval]);
  
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
          txid: txid,
        }
      });
      if (pixCreateError) throw pixCreateError;
      
      if (pixCreateData?.success && pixCreateData.pix_data) {
        const { pixCopiaECola, imagem_base64 } = pixCreateData.pix_data;
        setPixData({
          qrCodeBase64: imagem_base64,
          pixCopiaECola: pixCopiaECola,
          txid: txid,
        });
        
        // Update reservation with Pix details
        await supabase
          .from('reservas')
          .update({
            pix_txid: txid,
            pix_qr_code_base64: imagem_base64,
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
  
  if (!currentTutor || !currentPet) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 text-center text-muted-foreground">
          <XCircle className="w-12 h-12 mb-4 text-destructive" />
          <p className="text-lg font-semibold">Dados do tutor ou pet não encontrados.</p>
          <p className="text-sm">Por favor, verifique o link ou inicie a reserva novamente pelo WhatsApp.</p>
          <Button onClick={() => navigate('/')} className="mt-6">Voltar para o Início</Button>
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
            Olá <span className="font-semibold">{currentTutor.nome}</span>! Vamos reservar um lugar para <span className="font-semibold">{currentPet.nome}</span> ({currentPet.especie === 'cachorro' ? '🐶' : '🐱'}).
          </p>
        </div>
        
        {currentStep === 1 && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>1. Selecione as Datas e Unidade</CardTitle>
              <CardDescription>Escolha o período de hospedagem e a unidade desejada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="unidade_id">Unidade</Label>
                <Select value={selectedUnidadeId} onValueChange={setSelectedUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
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
                  disabled={(date) => 
                    isBefore(date, new Date()) || 
                    isDateUnavailable(date)
                  }
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
                disabled={!dateRange.from || !dateRange.to || !selectedUnidadeId || reservationValue <= 0}
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
                <p className="font-semibold text-foreground">{currentPet.nome} ({currentPet.especie === 'cachorro' ? '🐶' : '🐱'})</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tutor:</p>
                <p className="font-semibold text-foreground">{currentTutor.nome}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Unidade:</p>
                <p className="font-semibold text-foreground">{unidades.find(u => u.id === selectedUnidadeId)?.nome}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Período:</p>
                <p className="font-semibold text-foreground">
                  {dateRange.from && format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - 
                  {dateRange.to && format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
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
                      <QRCode 
                        value={pixData.pixCopiaECola} 
                        size={192} 
                        level="H" 
                        includeMargin={true} 
                      />
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