import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tutor } from '@/types'; // Import the updated type

export function useTutores() {
  return useQuery({
    queryKey: ['tutores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutores')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tutor[];
    },
  });
}

export function useCreateTutor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tutor: Omit<Tutor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tutores')
        .insert(tutor)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({ title: 'Tutor cadastrado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao cadastrar tutor', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteTutor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tutores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({ title: 'Tutor excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao excluir tutor', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}