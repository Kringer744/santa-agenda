import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Clinica } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useClinicas() {
  return useQuery<Clinica[]>({
    queryKey: ['clinicas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clinicas').select('*');
      if (error) throw error;
      return data as Clinica[];
    },
  });
}

export function useCreateClinica() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (clinica: Omit<Clinica, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clinicas')
        .insert(clinica)
        .select()
        .single();

      if (error) throw error;
      return data as Clinica;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicas'] });
      toast({
        title: 'Clínica criada com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar clínica',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useDeleteClinica() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clinicas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicas'] });
      toast({
        title: 'Clínica excluída com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir clínica',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}