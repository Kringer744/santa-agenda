// Este hook foi simplificado pois as credenciais estão diretamente nas funções Edge
// Mantivemos a estrutura para compatibilidade com o código existente

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function useItauSettings() {
  // Como as credenciais estão nas funções Edge, retornamos um objeto vazio
  // para manter a compatibilidade com o código existente
  return useQuery({
    queryKey: ['itauSettings'],
    queryFn: async () => {
      // Simular uma configuração vazia
      return {};
    },
  });
}

export function useSaveItauSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // Como as credenciais estão nas funções Edge, não precisamos salvar nada
      // Simular sucesso
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itauSettings'] });
      // Não mostrar toast pois não há nada para salvar
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}