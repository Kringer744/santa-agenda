import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dentista } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useDentistas() {
  return useQuery<Dentista[]>({
    queryKey: ['dentistas'],
    queryFn: async () => {
      // Chamada explícita para a tabela 'dentistas'
      const { data, error } = await supabase.from('dentistas').select('*');
      if (error) {
        console.error('Erro ao buscar dentistas:', error);
        throw error;
      }
      return data as Dentista[];
    },
  });
}

export function useCreateDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (dentista: Omit<Dentista, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('dentistas')
        .insert(dentista)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar dentista:', error);
        throw error;
      }
      return data as Dentista;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] });
      toast({ title: 'Dentista cadastrado com sucesso!' });
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

export function useDeleteDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dentistas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] });
      toast({ title: 'Dentista excluído com sucesso!' });
    },
  });
}