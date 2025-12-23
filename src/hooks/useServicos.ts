import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ServicoAdicional } from '@/types';
import { servicosAdicionais } from '@/data/mockData';

export function useServicos() {
  return useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      // Usando dados fictícios
      return new Promise<ServicoAdicional[]>((resolve) => {
        setTimeout(() => resolve(servicosAdicionais), 300);
      });
    },
  });
}

export function useCreateServico() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (servico: Omit<ServicoAdicional, 'id' | 'created_at'>) => {
      const newServico = {
        ...servico,
        id: `servico-${Date.now()}`,
        created_at: new Date().toISOString(),
      } as ServicoAdicional;
      
      // Simular delay de API
      return new Promise<ServicoAdicional>((resolve) => {
        setTimeout(() => resolve(newServico), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({
        title: 'Serviço criado com sucesso!'
      });
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
      // Simular atualização
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id, ...servico }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      toast({
        title: 'Serviço atualizado!'
      });
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