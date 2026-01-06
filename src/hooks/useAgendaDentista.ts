import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AgendaDentista } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Hook para buscar a agenda de um dentista para um dia específico
export function useAgendaDia(dentistaId: string | undefined, date: string | undefined) {
  return useQuery<AgendaDentista | null>({
    queryKey: ['agendaDentistaDoDia', dentistaId, date],
    queryFn: async () => {
      if (!dentistaId || !date) return null;
      const { data, error } = await supabase
        .from('agenda_dentista')
        .select('*')
        .eq('dentista_id', dentistaId)
        .eq('data', date)
        .maybeSingle();
      if (error) throw error;
      return data as AgendaDentista;
    },
    enabled: !!dentistaId && !!date,
  });
}

// NOVO: Hook para buscar todas as agendas (para uso em Dashboard e ClientAppointment)
export function useTodasAgendas() {
  return useQuery<AgendaDentista[]>({
    queryKey: ['todasAgendas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agenda_dentista').select('*');
      if (error) throw error;
      return data as AgendaDentista[];
    },
  });
}

export function useCreateAgendaDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (agenda: Omit<AgendaDentista, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('agenda_dentista')
        .insert(agenda)
        .select()
        .single();

      if (error) throw error;
      return data as AgendaDentista;
    },
    onSuccess: (data: AgendaDentista) => {
      queryClient.invalidateQueries({ queryKey: ['agendaDentistaDoDia', data.dentista_id, data.data] });
      queryClient.invalidateQueries({ queryKey: ['todasAgendas'] }); // Invalida o novo hook também
      toast({ title: 'Agenda do dia criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar agenda do dia', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAgendaDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...agenda }: Partial<AgendaDentista> & { id: string }) => {
      const { data, error } = await supabase
        .from('agenda_dentista')
        .update(agenda)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AgendaDentista;
    },
    onSuccess: (data: AgendaDentista) => {
      queryClient.invalidateQueries({ queryKey: ['agendaDentistaDoDia', data.dentista_id, data.data] });
      queryClient.invalidateQueries({ queryKey: ['todasAgendas'] }); // Invalida o novo hook também
      toast({ title: 'Agenda do dia atualizada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar agenda do dia', description: error.message, variant: 'destructive' });
    },
  });
}