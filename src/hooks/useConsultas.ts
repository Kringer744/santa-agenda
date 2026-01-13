import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Consulta } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { checkAndSendAutomatedMessages } from '@/lib/whatsappClinicAutomation';

export function useConsultas() {
  return useQuery<Consulta[]>({
    queryKey: ['consultas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('consultas').select('*');
      if (error) throw error;
      return data as unknown as Consulta[];
    },
  });
}

export function useCreateConsulta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (consulta: Omit<Consulta, 'id' | 'created_at' | 'updated_at' | 'codigo_consulta' | 'status' | 'pagamento_status'>) => {
      const codigoConsulta = `DC${Date.now().toString(36).toUpperCase().substring(0, 7)}`;
      
      const { data, error } = await supabase
        .from('consultas')
        .insert({
          ...consulta,
          codigo_consulta: codigoConsulta,
          status: 'confirmada',
          pagamento_status: 'pendente',
        })
        .select()
        .single();
        
      if (error) throw error;
      if (data) await checkAndSendAutomatedMessages(data as unknown as Consulta);
      return data as unknown as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Consulta confirmada com sucesso!' });
    },
  });
}

export function useUpdateConsultaStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Consulta['status'] }) => {
      const { data, error } = await supabase
        .from('consultas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      if (data) await checkAndSendAutomatedMessages(data as unknown as Consulta);
      return data as unknown as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Status atualizado!' });
    },
  });
}

export function useUpdateConsultaValue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, valor_total }: { id: string; valor_total: number }) => {
      const { data, error } = await supabase
        .from('consultas')
        .update({ valor_total, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data as unknown as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Valor da consulta atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar valor', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteConsulta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Buscar detalhes da consulta para saber o horário e dentista
      const { data: consulta, error: fetchError } = await supabase
        .from('consultas')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      if (!consulta) throw new Error("Consulta não encontrada.");

      // 2. Tentar liberar o horário na agenda_dentista
      const dataISO = consulta.data_hora_inicio.split('T')[0];
      const horario = consulta.data_hora_inicio.split('T')[1].substring(0, 5); // Pega o HH:mm

      const { data: agenda, error: agendaError } = await supabase
        .from('agenda_dentista')
        .select('*')
        .eq('dentista_id', consulta.dentista_id)
        .eq('data', dataISO)
        .maybeSingle();

      if (!agendaError && agenda) {
        // Remove do array de ocupados e devolve para o array de disponíveis
        const novosOcupados = agenda.horarios_ocupados.filter((h: string) => h !== horario);
        const novosDisponiveis = [...agenda.horarios_disponiveis, horario].sort();

        await supabase
          .from('agenda_dentista')
          .update({
            horarios_ocupados: novosOcupados,
            horarios_disponiveis: novosDisponiveis,
            updated_at: new Date().toISOString()
          })
          .eq('id', agenda.id);
      }

      // 3. Deletar a consulta
      const { error: deleteError } = await supabase.from('consultas').delete().eq('id', id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      queryClient.invalidateQueries({ queryKey: ['todasAgendas'] });
      queryClient.invalidateQueries({ queryKey: ['agendaDentistaDoDia'] });
      toast({ title: 'Consulta excluída e horário liberado na agenda.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir consulta', description: error.message, variant: 'destructive' });
    },
  });
}