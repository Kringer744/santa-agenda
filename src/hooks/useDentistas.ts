import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dentista } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useDentistas() {
  return useQuery<Dentista[]>({
    queryKey: ['dentistas'],
    queryFn: async () => {
      console.log("Iniciando busca por dentistas no Supabase...");
      const { data, error } = await supabase.from('dentistas').select('*').order('nome');
      if (error) {
        console.error("Erro ao buscar dentistas:", error);
        throw error;
      }
      console.log("Dentistas recebidos do Supabase:", data);
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
        if (error.code === '23505') {
          throw new Error('Este CRO já está cadastrado no sistema.');
        }
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

export function useUpdateDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...dentista }: Partial<Dentista> & { id: string }) => {
      const { data, error } = await supabase
        .from('dentistas')
        .update(dentista)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Dentista;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] });
      toast({ title: `Dentista ${data.nome} atualizado!` });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar dentista',
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
      toast({ title: 'Dentista removido com sucesso.' });
    },
  });
}