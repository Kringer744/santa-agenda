import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Procedimento } from '@/types'; // Updated type
import { supabase } from '@/integrations/supabase/client';

export function useProcedimentos() { // Changed hook name
  return useQuery<Procedimento[]>({
    queryKey: ['procedimentos'], // Changed query key
    queryFn: async () => {
      const { data, error } = await supabase.from('procedimentos').select('*'); // Changed table name
      if (error) throw error;
      return data as Procedimento[];
    },
  });
}

export function useCreateProcedimento() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (procedimento: Omit<Procedimento, 'id' | 'created_at'>) => { // Updated type
      const { data, error } = await supabase
        .from('procedimentos') // Changed table name
        .insert(procedimento)
        .select()
        .single();

      if (error) throw error;
      return data as Procedimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] }); // Changed query key
      toast({
        title: 'Procedimento criado com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar procedimento',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUpdateProcedimento() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...procedimento }: Partial<Procedimento> & { id: string }) => { // Updated type
      const { data, error } = await supabase
        .from('procedimentos') // Changed table name
        .update(procedimento)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Procedimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] }); // Changed query key
      toast({
        title: 'Procedimento atualizado!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar procedimento',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}