import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Unidade } from '@/types';
import { unidades } from '@/data/mockData'; // Import mock data

export function useUnidades() {
  return useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      // Temporarily return mock data for illustration
      return unidades as Unidade[];

      // Uncomment the following lines to fetch from Supabase when ready
      // const { data, error } = await supabase
      //   .from('unidades')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      
      // if (error) throw error;
      // return data as Unidade[];
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast({ title: 'Unidade criada com sucesso!' });
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
      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast({ title: 'Unidade excluída com sucesso!' });
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