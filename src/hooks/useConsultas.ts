import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Consulta } from '@/types'; // Updated type
import { supabase } from '@/integrations/supabase/client';
import { checkAndSendAutomatedMessages } from '@/lib/whatsappClinicAutomation'; // Updated import

export function useConsultas() { // Changed hook name
  return useQuery<Consulta[]>({
    queryKey: ['consultas'], // Changed query key
    queryFn: async () => {
      const { data, error } = await supabase.from('consultas').select('*'); // Changed table name
      if (error) throw error;
      return data as Consulta[];
    },
  });
}

export function useCreateConsulta() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (consulta: Omit<Consulta, 'id' | 'created_at' | 'updated_at' | 'codigo_consulta' | 'status' | 'pagamento_status'>) => { // Updated type
      const codigoConsulta = `DC${Date.now().toString(36).toUpperCase().substring(0, 7)}`; // Gerar código de consulta
      
      const { data, error } = await supabase
        .from('consultas') // Changed table name
        .insert({
          ...consulta,
          codigo_consulta: codigoConsulta,
          status: 'agendada', // Status inicial
          pagamento_status: 'pendente', // Status de pagamento inicial
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Verificar envio de mensagens automáticas
      if (data) {
        await checkAndSendAutomatedMessages(data as Consulta);
      }
      
      return data as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] }); // Changed query key
      toast({ title: 'Consulta criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar consulta', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateConsultaStatus() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Consulta['status'] }) => { // Updated type
      const { data, error } = await supabase
        .from('consultas') // Changed table name
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Verificar envio de mensagens automáticas
      if (data) {
        await checkAndSendAutomatedMessages(data as Consulta);
      }
      
      return data as Consulta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultas'] }); // Changed query key
      toast({ title: 'Status atualizado!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    },
  });
}