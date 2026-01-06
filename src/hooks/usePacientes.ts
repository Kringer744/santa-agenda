import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function usePacientes() {
  return useQuery<Paciente[]>({
    queryKey: ['pacientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pacientes').select('*').order('nome');
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

      if (error) {
        // Trata erro de CPF duplicado (Postgres error 23505)
        if (error.code === '23505') {
          throw new Error('Este CPF já está cadastrado no sistema.');
        }
        throw error;
      }
      return data as Paciente;
    },
    onSuccess: () => {
      // Invalida o cache para atualizar a lista instantaneamente
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast({ title: 'Paciente cadastrado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUpdatePaciente() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...paciente }: Partial<Paciente> & { id: string }) => {
      const { data, error } = await supabase
        .from('pacientes')
        .update(paciente)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Erro de violação de unicidade (ex: CPF duplicado)
          throw new Error('Este CPF ou telefone já está cadastrado para outro paciente.');
        }
        throw error;
      }
      return data as Paciente;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast({ title: `Paciente ${data.nome} atualizado com sucesso!` });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar paciente',
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
      toast({ title: 'Paciente removido com sucesso.' });
    },
  });
}