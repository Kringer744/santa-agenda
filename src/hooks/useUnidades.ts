import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Unidade } from '@/types';
import { unidades } from '@/data/mockData';

export function useUnidades() {
  return useQuery({
    queryKey: ['unidades'],
    queryFn: async () => {
      // Usando dados fictícios
      return new Promise<Unidade[]>((resolve) => {
        setTimeout(() => resolve(unidades), 300);
      });
    },
  });
}

export function useCreateUnidade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (unidade: Omit<Unidade, 'id' | 'created_at' | 'updated_at'>) => {
      const newUnidade = {
        ...unidade,
        id: `unidade-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Unidade;
      
      // Simular delay de API
      return new Promise<Unidade>((resolve) => {
        setTimeout(() => resolve(newUnidade), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast({
        title: 'Unidade criada com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar unidade',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useDeleteUnidade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Simular deleção
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      toast({
        title: 'Unidade excluída com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir unidade',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}