import { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, Stethoscope, Clock, XCircle, CheckCircle, Plus } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { useClinicas } from '@/hooks/useClinicas';
import { useAgendaDentistaDoDia, useCreateAgendaDentista, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista';
import { cn } from '@/lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAgendaOpen, setIsAgendaOpen] = useState(true);
  const [customSlotsInput, setCustomSlotsInput] = useState('');

  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas();
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas();
  
  // Usar o primeiro dentista e clínica encontrados
  const defaultDentistaId = dentistas[0]?.id;
  const defaultClinicaId = clinicas[0]?.id;

  const formattedSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
  const { data: agendaDoDia, isLoading: loadingAgendaDoDia } = useAgendaDentistaDoDia(defaultDentistaId, formattedSelectedDate);
  
  const createAgenda = useCreateAgendaDentista();
  const updateAgenda = useUpdateAgendaDentista();

  useEffect(() => {
    if (agendaDoDia) {
      setIsAgendaOpen(agendaDoDia.horarios_disponiveis && agendaDoDia.horarios_disponiveis.length > 0);
      setCustomSlotsInput(agendaDoDia.horarios_disponiveis?.join(', ') || '');
    } else {
      setIsAgendaOpen(true); // Default to open if no agenda exists
      setCustomSlotsInput(DEFAULT_TIME_SLOTS.join(', '));
    }
  }, [agendaDoDia]);

  const handleSaveAgenda = async () => {
    if (!defaultDentistaId || !defaultClinicaId || !selectedDate) {
      toast.error('Dados da clínica não carregados. Verifique as configurações.');
      return;
    }

    const slotsToSave = isAgendaOpen 
      ? (customSlotsInput.split(',').map(s => s.trim()).filter(Boolean).sort() || DEFAULT_TIME_SLOTS)
      : [];

    const agendaData = {
      dentista_id: defaultDentistaId,
      clinica_id: defaultClinicaId,
      data: formattedSelectedDate!,
      horarios_disponiveis: slotsToSave,
      horarios_ocupados: agendaDoDia?.horarios_ocupados || [],
    };

    try {
      if (agendaDoDia) {
        await updateAgenda.mutateAsync({ id: agendaDoDia.id, ...agendaData });
      } else {
        await createAgenda.mutateAsync(agendaData);
      }
      toast.success('Agenda salva com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao salvar agenda: ${error.message}`);
    }
  };

  const handleToggleSlot = (slot: string) => {
    if (!agendaDoDia) return; // Should not happen if agenda is loaded

    const isOccupied = agendaDoDia.horarios_ocupados?.includes(slot);
    let updatedOccupiedSlots = [...(agendaDoDia.horarios_ocupados || [])];

    if (isOccupied) {
      updatedOccupiedSlots = updatedOccupiedSlots.filter(s => s !== slot);
    } else {
      updatedOccupiedSlots.push(slot);
    }
    updatedOccupiedSlots.sort();

    updateAgenda.mutate({
      id: agendaDoDia.id,
      horarios_ocupados: updatedOccupiedSlots,
    });
  };

  const isLoading = loadingDentistas || loadingClinicas || loadingAgendaDoDia || createAgenda.isPending || updateAgenda.isPending;

  const currentDentistaName = dentistas.find(d => d.id === defaultDentistaId)?.nome || 'Dentista';
  const currentClinicaName = clinicas.find(c => c.id === defaultClinicaId)?.nome || 'Clínica';

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gerenciar Agenda</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Defina a disponibilidade de horários para a clínica.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna de Seleção e Calendário */}
          <Card className="lg:col-span-1 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Stethoscope className="w-5 h-5 text-primary" />
                Agenda da Clínica
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Selecione a data para gerenciar a disponibilidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(loadingDentistas || loadingClinicas) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Carregando dados da clínica...</p>
                </div>
              ) : (!defaultDentistaId || !defaultClinicaId) ? (
                <div className="text-center py-8 text-destructive">
                  <p>Nenhum dentista ou clínica encontrados. Por favor, cadastre-os nas configurações.</p>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    className="rounded-md border shadow-card p-3"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coluna de Configuração da Agenda */}
          <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <CalendarDays className="w-5 h-5 text-secondary" />
                Configurar Disponibilidade para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'o dia'}
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Defina se a agenda está aberta ou fechada e os horários disponíveis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(!defaultDentistaId || !defaultClinicaId || !selectedDate) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Selecione uma data para configurar a agenda.</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="agenda-status" className="text-base">
                      Agenda {isAgendaOpen ? 'Aberta' : 'Fechada'}
                    </Label>
                    <Switch
                      id="agenda-status"
                      checked={isAgendaOpen}
                      onCheckedChange={setIsAgendaOpen}
                    />
                  </div>

                  {isAgendaOpen && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-slots">Horários Disponíveis (separados por vírgula)</Label>
                      <Input
                        id="custom-slots"
                        value={customSlotsInput}
                        onChange={(e) => setCustomSlotsInput(e.target.value)}
                        placeholder="Ex: 09:00, 09:30, 10:00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Horários que os pacientes podem agendar. Use o formato HH:mm.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Label className="text-base">Horários do Dia</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {(agendaDoDia?.horarios_disponiveis || DEFAULT_TIME_SLOTS).map((slot) => {
                        const isOccupied = agendaDoDia?.horarios_ocupados?.includes(slot);
                        return (
                          <Button
                            key={slot}
                            variant={isOccupied ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleSlot(slot)}
                            disabled={!isAgendaOpen}
                            className={cn(
                              "flex items-center gap-1",
                              isOccupied ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "hover:bg-muted"
                            )}
                          >
                            {isOccupied ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {slot}
                          </Button>
                        );
                      })}
                    </div>
                    {!isAgendaOpen && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Agenda fechada para este dia. Nenhum horário disponível.
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSaveAgenda}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Agenda'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}