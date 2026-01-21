import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Procedimento } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useProcedimentos() {
  return useQuery<Procedimento[]>({
    queryKey: ['procedimentos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('procedimentos').select('*');
      if (error) throw error;
      return data as Procedimento[];
    },
  });
}

export function useCreateProcedimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (procedimento: Omit<Procedimento, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('procedimentos')
        .insert(procedimento)
        .select()
        .single();

      if (error) throw error;
      return data as Procedimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
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

export function useUpdateProcedimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...procedimento }: Partial<Procedimento> & { id: string }) => {
      const { data, error } = await supabase
        .from('procedimentos')
        .update(procedimento)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Procedimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
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

export function useDeleteProcedimento() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('procedimentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
      toast({
        title: 'Procedimento removido com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover procedimento',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}