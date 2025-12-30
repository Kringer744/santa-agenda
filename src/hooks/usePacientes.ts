import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function usePacientes() {
  return useQuery<Paciente[]>({
    queryKey: ['pacientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pacientes').select('*');
      if (error) throw error;
      return data as Paciente[];
    },
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (paciente: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pacientes')
        .insert(paciente)
        .select()
        .single();

      if (error) throw error;
      return data as Paciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast({ title: 'Paciente cadastrado com sucesso!' });
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

export function useDeletePaciente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast({ title: 'Paciente excluído com sucesso!' });
    },
  });
}