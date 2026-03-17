import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Consulta } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { checkAndSendAutomatedMessages } from '@/lib/whatsappClinicAutomation';

export function useConsultas() {
  return useQuery<Consulta[]>({
    queryKey: ['consultas'],
    staleTime: 1000 * 60, // 1 minuto de cache
    queryFn: async () => {
      const { data, error } = await supabase.from('consultas').select('*').order('data_hora_inicio', { ascending: false });
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
          status: 'agendada',
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
      toast({ title: 'Consulta agendada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar consulta',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUpdateConsulta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Consulta> & { id: string }) => {
      const { data, error } = await supabase
        .from('consultas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data as unknown as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Consulta atualizada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
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
      return data as unknown as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Status atualizado!' });
    },
  });
}

export function useDeleteConsulta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Consulta excluída com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });
}