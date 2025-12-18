import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pet {
  id: string;
  tutor_id: string;
  nome: string;
  especie: 'cachorro' | 'gato';
  raca: string | null;
  porte: 'pequeno' | 'medio' | 'grande' | null;
  idade: number | null;
  data_nascimento: string | null;
  necessidades_especiais: string | null;
  observacoes_comportamentais: string | null;
  created_at: string;
  updated_at: string;
}

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Pet[];
    },
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pet: Omit<Pet, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pets')
        .insert(pet)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({ title: 'Pet cadastrado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao cadastrar pet', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({ title: 'Pet excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao excluir pet', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}
