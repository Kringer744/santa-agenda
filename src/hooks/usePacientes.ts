import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types'; // Updated type
import { supabase } from '@/integrations/supabase/client';

export function usePacientes() { // Changed hook name
  return useQuery<Paciente[]>({
    queryKey: ['pacientes'], // Changed query key
    queryFn: async () => {
      const { data, error } = await supabase.from('pacientes').select('*'); // Changed table name
      if (error) throw error;
      return data as Paciente[];
    },
  });
}

export function useCreatePaciente() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (paciente: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>) => { // Updated type
      const { data, error } = await supabase
        .from('pacientes') // Changed table name
        .insert(paciente)
        .select()
        .single();

      if (error) throw error;
      return data as Paciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] }); // Changed query key
      toast({
        title: 'Paciente cadastrado com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar paciente',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useDeletePaciente() { // Changed hook name
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pacientes').delete().eq('id', id); // Changed table name
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] }); // Changed query key
      toast({
        title: 'Paciente excluído com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir paciente',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}