import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Pet } from '@/types';
import { petsMock } from '@/data/mockData';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      // Usando dados fictícios
      return new Promise<Pet[]>((resolve) => {
        setTimeout(() => resolve(petsMock), 300);
      });
    },
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (pet: Omit<Pet, 'id' | 'created_at' | 'updated_at'>) => {
      const newPet = {
        ...pet,
        id: `pet-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Pet;
      
      // Simular delay de API
      return new Promise<Pet>((resolve) => {
        setTimeout(() => resolve(newPet), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({
        title: 'Pet cadastrado com sucesso!'
      });
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
      // Simular deleção
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({
        title: 'Pet excluído com sucesso!'
      });
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