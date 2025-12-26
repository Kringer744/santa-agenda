import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Unidade } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useUnidades() {
  return useQuery<Unidade[]>({
    queryKey: ['unidades'],
    queryFn: async () => {
      const { data, error } = await supabase.from('unidades').select('*');
      if (error) throw error;
      return data as Unidade[];
    },
  });
}

export function useCreateUnidade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (unidade: Omit<Unidade, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('unidades')
        .insert(unidade)
        .select()
        .single();

      if (error) throw error;
      return data as Unidade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast({
        title: 'Unidade criada com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar unidade',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useDeleteUnidade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('unidades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast({
        title: 'Unidade excluída com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir unidade',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}