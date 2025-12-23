import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Pet } from '@/types';
import { petsMock } from '@/data/mockData'; // Import mock data

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      // Temporarily return mock data for illustration
      return petsMock as Pet[];

      // Uncomment the following lines to fetch from Supabase when ready
      // const { data, error } = await supabase
      //   .from('pets')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      
      // if (error) throw error;
      // return data as Pet[];
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