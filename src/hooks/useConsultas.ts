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
      return data as any as Consulta[];
    },
  });
}

export function useCreateConsulta() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (consulta: Omit<Consulta, 'id' | 'created_at' | 'updated_at' | 'codigo_consulta' | 'status' | 'pagamento_status'>) => {
      const codigoConsulta = `DC${Date.now().toString(36).toUpperCase().substring(0, 7)}`;
      
      const { data, error } = await (supabase.from('consultas') as any)
        .insert({
          ...consulta,
          codigo_consulta: codigoConsulta,
          status: 'agendada',
          pagamento_status: 'pendente',
        })
        .select()
        .single();
        
      if (error) throw error;
      if (data) await checkAndSendAutomatedMessages(data as any as Consulta);
      return data as any as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Consulta criada com sucesso!' });
    },
  });
}

export function useUpdateConsultaStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Consulta['status'] }) => {
      const { data, error } = await (supabase.from('consultas') as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      if (data) await checkAndSendAutomatedMessages(data as any as Consulta);
      return data as any as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      toast({ title: 'Status atualizado!' });
    },
  });
}