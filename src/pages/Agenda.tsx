import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarDays, CheckCircle, XCircle, Clock, PlusCircle } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { useClinicas } from '@/hooks/useClinicas';
import { useAgendaDia, useCreateAgendaDentista, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
// Removido: import { AgendaDentista } from '@/types'; // Importar AgendaDentista type

const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDentistaId, setSelectedDentistaId] = useState<string>('');
  const [newManualSlot, setNewManualSlot] = useState('');
  
  const { data: dentistas = [] } = useDentistas();
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas(); // Adicionado isLoading para clinicas

  useEffect(() => {
    if (dentistas.length > 0 && !selectedDentistaId) setSelectedDentistaId(dentistas[0].id);
  }, [dentistas, selectedDentistaId]);

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: agendaExistente, isLoading: loadingAgenda } = useAgendaDia(selectedDentistaId, formattedDate);
  
  const createAgenda = useCreateAgendaDentista();
  const updateAgenda = useUpdateAgendaDentista();
  const googleCalendarSync = useGoogleCalendarSync();

  const selectedDentista = dentistas.find(d => d.id === selectedDentistaId);
  const googleCalendarId = selectedDentista?.google_calendar_id;

  // Adicionando logs para depuração
  useEffect(() => {
    console.log("[Agenda Debug] --- Estado do Botão 'Abrir Dia' ---");
    console.log("loadingAgenda:", loadingAgenda);
    console.log("createAgenda.isPending:", createAgenda.isPending);
    console.log("updateAgenda.isPending:", updateAgenda.isPending);
    console.log("clinicas.length:", clinicas.length);
    console.log("selectedDentistaId:", selectedDentistaId);
    console.log("selectedDentista:", selectedDentista);
    console.log("googleCalendarId:", googleCalendarId);
    console.log("-------------------------------------------------");
  }, [loadingAgenda, createAgenda.isPending, updateAgenda.isPending, clinicas.length, selectedDentistaId, selectedDentista, googleCalendarId]);


  const syncGoogleCalendar = async (action: 'createEvent' | 'updateEvent' | 'deleteEvent', eventData: any) => {
    if (!googleCalendarId) {
      toast.warning("ID do Google Calendar não configurado para este dentista.");
      return null; // Retorna null para indicar que não houve sincronização
    }
    try {
      const result = await googleCalendarSync.mutateAsync({ action, eventData, calendarId: googleCalendarId });
      toast.success(`Evento no Google Calendar ${action === 'createEvent' ? 'criado' : action === 'updateEvent' ? 'atualizado' : 'excluído'}!`);
      return result.event?.id; // Retorna o ID do evento do Google Calendar
    } catch (error) {
      console.error("Erro ao sincronizar com Google Calendar:", error);
      return null;
    }
  };

  const handleToggleDay = async (open: boolean) => {
    if (!selectedDentistaId || clinicas.length === 0 || !formattedDate || !selectedDentista) return;
    
    const slots = open ? DEFAULT_TIME_SLOTS : [];
    let newGoogleEventId: string | null = null;

    if (agendaExistente) {
      if (!open && agendaExistente.google_event_id) { // Se fechar o dia e houver um evento principal
        await syncGoogleCalendar('deleteEvent', { id: agendaExistente.google_event_id });
        newGoogleEventId = null;
      } else if (open && !agendaExistente.google_event_id) { // Se abrir o dia e não houver evento principal
        const startOfDay = parseISO(`${formattedDate}T08:00:00`);
        const endOfDay = parseISO(`${formattedDate}T18:00:00`);
        newGoogleEventId = await syncGoogleCalendar('createEvent', {
          summary: `Agenda de ${selectedDentista.nome} - ${format(selectedDate!, 'dd/MM')}`,
          description: `Horários disponíveis: ${slots.join(', ')}`,
          start: { dateTime: startOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: endOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
        });
      } else if (open && agendaExistente.google_event_id) { // Se abrir o dia e já houver evento principal
        const startOfDay = parseISO(`${formattedDate}T08:00:00`);
        const endOfDay = parseISO(`${formattedDate}T18:00:00`);
        await syncGoogleCalendar('updateEvent', {
          id: agendaExistente.google_event_id,
          summary: `Agenda de ${selectedDentista.nome} - ${format(selectedDate!, 'dd/MM')}`,
          description: `Horários disponíveis: ${slots.join(', ')}`,
          start: { dateTime: startOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: endOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
        });
        newGoogleEventId = agendaExistente.google_event_id;
      }

      await updateAgenda.mutateAsync({
        id: agendaExistente.id,
        horarios_disponiveis: slots,
        horarios_ocupados: [], // Limpa horários ocupados ao fechar/abrir o dia
        google_event_id: newGoogleEventId,
      });

    } else {
      if (open) {
        const startOfDay = parseISO(`${formattedDate}T08:00:00`);
        const endOfDay = parseISO(`${formattedDate}T18:00:00`);
        newGoogleEventId = await syncGoogleCalendar('createEvent', {
          summary: `Agenda de ${selectedDentista.nome} - ${format(selectedDate!, 'dd/MM')}`,
          description: `Horários disponíveis: ${slots.join(', ')}`,
          start: { dateTime: startOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: endOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
        });
      }

      await createAgenda.mutateAsync({
        dentista_id: selectedDentistaId,
        clinica_id: clinicas[0].id,
        data: formattedDate,
        horarios_disponiveis: slots,
        horarios_ocupados: [],
        google_event_id: newGoogleEventId,
      });
    }
  };

  const handleToggleSlot = async (slot: string) => {
    if (!agendaExistente || !selectedDentista) return;
    
    const isAvailable = agendaExistente.horarios_disponiveis.includes(slot);
    let newSlots: string[];
    
    if (isAvailable) {
      newSlots = agendaExistente.horarios_disponiveis.filter((s: string) => s !== slot);
    } else {
      newSlots = [...agendaExistente.horarios_disponiveis, slot].sort();
    }

    await updateAgenda.mutateAsync({
      id: agendaExistente.id,
      horarios_disponiveis: newSlots
    });

    // Atualizar a descrição do evento principal no Google Calendar
    if (agendaExistente.google_event_id) {
      const startOfDay = parseISO(`${formattedDate}T08:00:00`);
      const endOfDay = parseISO(`${formattedDate}T18:00:00`);
      await syncGoogleCalendar('updateEvent', {
        id: agendaExistente.google_event_id,
        summary: `Agenda de ${selectedDentista.nome} - ${format(selectedDate!, 'dd/MM')}`,
        description: `Horários disponíveis: ${newSlots.join(', ')}`,
        start: { dateTime: startOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
      });
    }
  };

  const handleAddManualSlot = async () => {
    if (!newManualSlot || !selectedDentistaId || !formattedDate || !selectedDentista) {
      toast.error("Preencha o horário e selecione um dentista e data.");
      return;
    }

    const [hour, minute] = newManualSlot.split(':');
    if (!hour || !minute || isNaN(parseInt(hour)) || isNaN(parseInt(minute))) {
      toast.error("Formato de horário inválido. Use HH:mm (ex: 08:00).");
      return;
    }

    const newSlotFormatted = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    let newGoogleEventId: string | null = null;

    if (agendaExistente) {
      if (agendaExistente.horarios_disponiveis.includes(newSlotFormatted)) {
        toast.info("Este horário já está disponível.");
        return;
      }
      const newSlots = [...agendaExistente.horarios_disponiveis, newSlotFormatted].sort();
      await updateAgenda.mutateAsync({
        id: agendaExistente.id,
        horarios_disponiveis: newSlots
      });

      // Atualizar a descrição do evento principal no Google Calendar
      if (agendaExistente.google_event_id) {
        const startOfDay = parseISO(`${formattedDate}T08:00:00`);
        const endOfDay = parseISO(`${formattedDate}T18:00:00`);
        await syncGoogleCalendar('updateEvent', {
          id: agendaExistente.google_event_id,
          summary: `Agenda de ${selectedDentista.nome} - ${format(selectedDate!, 'dd/MM')}`,
          description: `Horários disponíveis: ${newSlots.join(', ')}`,
          start: { dateTime: startOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: endOfDay.toISOString(), timeZone: 'America/Sao_Paulo' },
        });
      }
    } else {
      const newSlots = [newSlotFormatted];
      newGoogleEventId = await syncGoogleCalendar('createEvent', {
        summary: `Agenda de ${selectedDentista.nome} - ${format(selectedDate!, 'dd/MM')}`,
        description: `Horários disponíveis: ${newSlots.join(', ')}`,
        start: { dateTime: parseISO(`${formattedDate}T08:00:00`).toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: parseISO(`${formattedDate}T18:00:00`).toISOString(), timeZone: 'America/Sao_Paulo' },
      });

      await createAgenda.mutateAsync({
        dentista_id: selectedDentistaId,
        clinica_id: clinicas[0].id,
        data: formattedDate,
        horarios_disponiveis: newSlots,
        horarios_ocupados: [],
        google_event_id: newGoogleEventId,
      });
    }
    setNewManualSlot('');
  };

  const isDayOpen = !!(agendaExistente && agendaExistente.horarios_disponiveis.length > 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="text-primary" /> Gerenciar Agenda
            </h1>
            <p className="text-muted-foreground">Defina quais horários estarão disponíveis para agendamentos e sincronize com o Google Calendar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o Dentista</Label>
                <Select value={selectedDentistaId} onValueChange={setSelectedDentistaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dentista" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentistas.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="mx-auto rounded-md border shadow"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">
                  Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                </CardTitle>
                <CardDescription>Clique nos horários para ativar ou desativar</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="day-toggle" className="text-sm font-medium">Abrir Dia</Label>
                <Switch 
                  id="day-toggle"
                  checked={isDayOpen}
                  onCheckedChange={handleToggleDay}
                  disabled={loadingAgenda || createAgenda.isPending || updateAgenda.isPending || clinicas.length === 0 || !selectedDentistaId || loadingClinicas}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingAgenda || loadingClinicas ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[...new Set([...DEFAULT_TIME_SLOTS, ...(agendaExistente?.horarios_disponiveis || [])])].sort().map((slot: string) => {
                      const isAvailable = agendaExistente?.horarios_disponiveis.includes(slot);
                      const isOccupied = agendaExistente?.horarios_ocupados.includes(slot);
                      
                      return (
                        <Button
                          key={slot}
                          variant={isAvailable ? (isOccupied ? "destructive" : "default") : "outline"}
                          className={cn(
                            "h-12 flex items-center justify-between px-3 transition-all",
                            !isAvailable && "opacity-50 grayscale",
                            isOccupied && "cursor-not-allowed"
                          )}
                          onClick={() => !isOccupied && handleToggleSlot(slot)}
                          disabled={updateAgenda.isPending || isOccupied || !selectedDentistaId}
                        >
                          <span className="flex items-center gap-2">
                            <Clock size={14} />
                            {slot}
                          </span>
                          {isOccupied ? (
                            <XCircle size={14} />
                          ) : isAvailable ? (
                            <CheckCircle size={14} />
                          ) : null}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Input
                      type="time"
                      value={newManualSlot}
                      onChange={(e) => setNewManualSlot(e.target.value)}
                      placeholder="HH:mm"
                      className="w-32"
                      disabled={!selectedDentistaId}
                    />
                    <Button onClick={handleAddManualSlot} disabled={!selectedDentistaId || !newManualSlot || createAgenda.isPending || updateAgenda.isPending}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Horário
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}