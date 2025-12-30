import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarDays, Stethoscope, XCircle, CheckCircle } from 'lucide-react';
import { useDentistas } from '@/hooks/useDentistas';
import { useClinicas } from '@/hooks/useClinicas';
import { useAgendaDentistaDoDia, useCreateAgendaDentista, useUpdateAgendaDentista } from '@/hooks/useAgendaDentista';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  
  const defaultDentistaId = dentistas[0]?.id;
  const defaultClinicaId = clinicas[0]?.id;

  const formattedSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
  const { data: agendaDoDia, isLoading: loadingAgendaDoDia } = useAgendaDentistaDoDia(defaultDentistaId, formattedSelectedDate);
  
  const createAgenda = useCreateAgendaDentista();
  const updateAgenda = useUpdateAgendaDentista();

  useEffect(() => {
    if (agendaDoDia) {
      setIsAgendaOpen(!!agendaDoDia.horarios_disponiveis?.length);
      setCustomSlotsInput(agendaDoDia.horarios_disponiveis?.join(', ') || '');
    } else {
      setIsAgendaOpen(true);
      setCustomSlotsInput(DEFAULT_TIME_SLOTS.join(', '));
    }
  }, [agendaDoDia]);

  const handleSaveAgenda = async () => {
    if (!defaultDentistaId || !defaultClinicaId || !selectedDate) return;
    const slotsToSave = isAgendaOpen ? customSlotsInput.split(',').map(s => s.trim()).filter(Boolean).sort() : [];
    const agendaData = {
      dentista_id: defaultDentistaId,
      clinica_id: defaultClinicaId,
      data: formattedSelectedDate!,
      horarios_disponiveis: slotsToSave,
      horarios_ocupados: agendaDoDia?.horarios_ocupados || [],
    };
    try {
      if (agendaDoDia) await updateAgenda.mutateAsync({ id: agendaDoDia.id, ...agendaData });
      else await createAgenda.mutateAsync(agendaData);
      toast.success('Agenda salva!');
    } catch (error: any) { toast.error(error.message); }
  };

  const handleToggleSlot = (slot: string) => {
    if (!agendaDoDia) return;
    const isOccupied = agendaDoDia.horarios_ocupados?.includes(slot);
    const updatedOccupiedSlots = isOccupied ? agendaDoDia.horarios_ocupados.filter(s => s !== slot) : [...(agendaDoDia.horarios_ocupados || []), slot];
    updateAgenda.mutate({ id: agendaDoDia.id, horarios_ocupados: updatedOccupiedSlots.sort() });
  };

  const isLoading = loadingDentistas || loadingClinicas || loadingAgendaDoDia || createAgenda.isPending || updateAgenda.isPending;

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Gerenciar Agenda</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 p-6">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={ptBR} className="mx-auto" />
          </Card>
          <Card className="lg:col-span-2 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Label>Agenda {isAgendaOpen ? 'Aberta' : 'Fechada'}</Label>
              <Switch checked={isAgendaOpen} onCheckedChange={setIsAgendaOpen} />
            </div>
            {isAgendaOpen && <Input value={customSlotsInput} onChange={e => setCustomSlotsInput(e.target.value)} placeholder="09:00, 09:30..." />}
            <div className="grid grid-cols-4 gap-2">
              {(agendaDoDia?.horarios_disponiveis || DEFAULT_TIME_SLOTS).map(slot => (
                <Button key={slot} variant={agendaDoDia?.horarios_ocupados?.includes(slot) ? 'destructive' : 'outline'} size="sm" onClick={() => handleToggleSlot(slot)} disabled={!isAgendaOpen} className={cn("gap-1")}>
                  {agendaDoDia?.horarios_ocupados?.includes(slot) ? <XCircle className="w-3" /> : <CheckCircle className="w-3" />} {slot}
                </Button>
              ))}
            </div>
            <Button className="w-full" onClick={handleSaveAgenda} disabled={isLoading}>Salvar Agenda</Button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}