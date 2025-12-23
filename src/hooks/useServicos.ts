import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ServicoAdicional } from '@/types'; // Import the updated type

export function useServicos() {
  return useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_adicionais')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as ServicoAdicional[];
    },
  });
}

export function useCreateServico() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (servico: Omit<ServicoAdicional, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('servicos_adicionais')
        .insert(servico)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: 'Serviço criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar serviço', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateServico() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...servico }: Partial<ServicoAdicional> & { id: string }) => {
      const { data, error } = await supabase
        .from('servicos_adicionais')
        .update(servico)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({ title: 'Serviço atualizado!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao atualizar serviço', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}