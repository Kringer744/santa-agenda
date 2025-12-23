import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tutor } from '@/types';
import { tutoresMock } from '@/data/mockData';

export function useTutores() {
  return useQuery({
    queryKey: ['tutores'],
    queryFn: async () => {
      // Usando dados fictícios
      return new Promise<Tutor[]>((resolve) => {
        setTimeout(() => resolve(tutoresMock), 300);
      });
    },
  });
}

export function useCreateTutor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (tutor: Omit<Tutor, 'id' | 'created_at' | 'updated_at'>) => {
      const newTutor = {
        ...tutor,
        id: `tutor-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Tutor;
      
      // Simular delay de API
      return new Promise<Tutor>((resolve) => {
        setTimeout(() => resolve(newTutor), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({
        title: 'Tutor cadastrado com sucesso!'
      });
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
      // Simular deleção
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({
        title: 'Tutor excluído com sucesso!'
      });
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