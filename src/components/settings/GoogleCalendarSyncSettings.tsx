import { useState } from 'react'; // Adicionado: Importação de useState
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Removido: import { Label } from '@/components/ui/label'; // Já removido na correção anterior
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, Save } from 'lucide-react';
import { useDentistas, useUpdateDentista } from '@/hooks/useDentistas';
import { toast } from 'sonner';

export function GoogleCalendarSyncSettings() {
  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas();
  const updateDentista = useUpdateDentista();
  const [editingDentistaId, setEditingDentistaId] = useState<string | null>(null);
  const [calendarIdInput, setCalendarIdInput] = useState<string>('');

  const handleEditClick = (dentistaId: string, currentCalendarId: string | null) => {
    setEditingDentistaId(dentistaId);
    setCalendarIdInput(currentCalendarId || '');
  };

  const handleSaveCalendarId = async (dentistaId: string) => {
    try {
      await updateDentista.mutateAsync({
        id: dentistaId,
        google_calendar_id: calendarIdInput.trim() || null,
      });
      toast.success('ID do Google Calendar atualizado!');
      setEditingDentistaId(null);
      setCalendarIdInput('');
    } catch (error: any) {
      toast.error(`Erro ao salvar ID: ${error.message}`);
    }
  };

  if (loadingDentistas) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <CalendarDays className="w-5 h-5 text-primary" />
          Sincronizar Google Calendar
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Vincule os calendários do Google de cada dentista para sincronização automática de agendamentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dentistas.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum dentista cadastrado para configurar.</p>
        ) : (
          <div className="space-y-4">
            {dentistas.map((dentista) => (
              <div key={dentista.id} className="p-4 rounded-xl bg-muted/50 space-y-2 border">
                <h4 className="font-semibold text-foreground text-base">{dentista.nome}</h4>
                {editingDentistaId === dentista.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={calendarIdInput}
                      onChange={(e) => setCalendarIdInput(e.target.value)}
                      placeholder="ID do Google Calendar (ex: email@gmail.com)"
                      className="flex-1"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveCalendarId(dentista.id)} 
                      disabled={updateDentista.isPending}
                    >
                      {updateDentista.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingDentistaId(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      ID: {dentista.google_calendar_id || 'Não configurado'}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditClick(dentista.id, dentista.google_calendar_id)}
                    >
                      Editar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}