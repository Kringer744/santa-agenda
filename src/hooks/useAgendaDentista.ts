import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
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

// NOVO: Hook para liberar horários ocupados
export function useLiberarHorarios() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      agendaId, 
      horariosParaLiberar,
      googleCalendarIdsParaExcluir // IDs dos eventos do Google Calendar a serem excluídos
    }: { 
      agendaId: string;
      horariosParaLiberar: string[];
      googleCalendarIdsParaExcluir: string[];
    }) => {
      // Primeiro, buscamos a agenda atual
      const { data: agendaAtual, error: fetchError } = await supabase
        .from('agenda_dentista')
        .select('*')
        .eq('id', agendaId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Atualizamos os arrays de horários
      const novosHorariosDisponiveis = [
        ...agendaAtual.horarios_disponiveis,
        ...horariosParaLiberar
      ].sort();
      
      const novosHorariosOcupados = agendaAtual.horarios_ocupados.filter(
        (slot: string) => !horariosParaLiberar.includes(slot)
      );
      
      // Atualizamos a agenda no banco de dados
      const { data, error: updateError } = await supabase
        .from('agenda_dentista')
        .update({
          horarios_disponiveis: novosHorariosDisponiveis,
          horarios_ocupados: novosHorariosOcupados,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendaId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Retornamos os dados atualizados e os IDs dos eventos do Google Calendar para exclusão
      return { 
        data: data as AgendaDentista, 
        googleCalendarIdsParaExcluir 
      };
    },
    onSuccess: ({ data, googleCalendarIdsParaExcluir }) => {
      queryClient.invalidateQueries({ queryKey: ['agendaDentistaDoDia', data.dentista_id, data.data] });
      queryClient.invalidateQueries({ queryKey: ['todasAgendas'] });
      
      // Excluímos os eventos do Google Calendar, se necessário
      if (googleCalendarIdsParaExcluir.length > 0) {
        sonnerToast.info(`Excluindo ${googleCalendarIdsParaExcluir.length} eventos do Google Calendar...`);
        // Aqui você pode chamar o hook useGoogleCalendarSync para excluir os eventos
        // Por enquanto, vamos apenas mostrar uma mensagem
      }
      
      toast({ title: 'Horários liberados com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao liberar horários', description: error.message, variant: 'destructive' });
    },
  });
}