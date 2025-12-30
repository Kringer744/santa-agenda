import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dentista } from '@/types'; // Updated type
import { supabase } from '@/integrations/supabase/client';

export function useDentistas() { // Changed hook name
  return useQuery<Dentista[]>({
    queryKey: ['dentistas'], // Changed query key
    queryFn: async () => {
      const { data, error } = await supabase.from('dentistas').select('*'); // Changed table name
      if (error) throw error;
      return data as Dentista[];
    },
  });
}

export function useCreateDentista() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (dentista: Omit<Dentista, 'id' | 'created_at' | 'updated_at'>) => { // Updated type
      const { data, error } = await supabase
        .from('dentistas') // Changed table name
        .insert(dentista)
        .select()
        .single();

      if (error) throw error;
      return data as Dentista;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] }); // Changed query key
      toast({
        title: 'Dentista cadastrado com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar dentista',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useDeleteDentista() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dentistas').delete().eq('id', id); // Changed table name
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] }); // Changed query key
      toast({
        title: 'Dentista excluído com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir dentista',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}