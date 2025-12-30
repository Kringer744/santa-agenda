import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarDays, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { useClinicas } from '@/hooks/useClinicas';
import { useAgendaDentistaDoDia, useCreateAgendaDentista, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDentistaId, setSelectedDentistaId] = useState<string>('');
  const [selectedClinicaId, setSelectedClinicaId] = useState<string>('');
  
  const { data: dentistas = [] } = useDentistas();
  const { data: clinicas = [] } = useClinicas();

  useEffect(() => {
    if (dentistas.length > 0 && !selectedDentistaId) setSelectedDentistaId(dentistas[0].id);
    if (clinicas.length > 0 && !selectedClinicaId) setSelectedClinicaId(clinicas[0].id);
  }, [dentistas, clinicas, selectedDentistaId, selectedClinicaId]);

  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: agendaExistente, isLoading: loadingAgenda } = useAgendaDentistaDoDia(selectedDentistaId, formattedDate);
  
  const createAgenda = useCreateAgendaDentista();
  const updateAgenda = useUpdateAgendaDentista();

  const handleToggleDay = async (open: boolean) => {
    if (!selectedDentistaId || !selectedClinicaId || !formattedDate) return;
    
    const slots = open ? DEFAULT_TIME_SLOTS : [];
    
    if (agendaExistente) {
      await updateAgenda.mutateAsync({
        id: agendaExistente.id,
        horarios_disponiveis: slots,
        horarios_ocupados: []
      });
    } else {
      await createAgenda.mutateAsync({
        dentista_id: selectedDentistaId,
        clinica_id: selectedClinicaId,
        data: formattedDate,
        horarios_disponiveis: slots,
        horarios_ocupados: []
      });
    }
  };

  const handleToggleSlot = async (slot: string) => {
    if (!agendaExistente) return;
    
    const isAvailable = agendaExistente.horarios_disponiveis.includes(slot);
    let newSlots: string[];
    
    if (isAvailable) {
      newSlots = agendaExistente.horarios_disponiveis.filter(s => s !== slot);
    } else {
      newSlots = [...agendaExistente.horarios_disponiveis, slot].sort();
    }

    await updateAgenda.mutateAsync({
      id: agendaExistente.id,
      horarios_disponiveis: newSlots
    });
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
            <p className="text-muted-foreground">Defina quais horários estarão disponíveis para os clientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dentista</Label>
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

              <div className="space-y-2">
                <Label>Clínica</Label>
                <Select value={selectedClinicaId} onValueChange={setSelectedClinicaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a clínica" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinicas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
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
                  className="rounded-md border shadow"
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
                  disabled={loadingAgenda || createAgenda.isPending || updateAgenda.isPending}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingAgenda ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {DEFAULT_TIME_SLOTS.map(slot => {
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
                        disabled={updateAgenda.isPending || isOccupied}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}